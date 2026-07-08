import { given, then, useBeforeAll } from 'test-fns';
import { getUuid } from 'uuid-fns';

import { getTestBucket } from '../__test_assets__/getTestBucket';
import { S3ConditionalConflictError } from '../domain.objects/S3ConditionalConflictError';
import { S3PreconditionFailedError } from '../domain.objects/S3PreconditionFailedError';
import { set } from './set';

// concurrency contract: exactly one put-if-absent wins; every loser is a typed
// S3PreconditionFailedError|S3ConditionalConflictError. the 412-vs-409 split is
// s3-ordered, so we assert the typed-error SET, not a fixed code — deterministic assertion over a live path.
describe('conditional-write concurrency', () => {
  const bucket = getTestBucket();

  given(
    '[case1] N concurrent put-if-absent writes race for one fresh key',
    () => {
      const key = `test/${getUuid()}/concurrency-put-if-absent.txt`;
      const racers = 16;

      const scene = useBeforeAll(async () => {
        const outcomes = await Promise.allSettled(
          Array.from({ length: racers }, (_, index) =>
            set({
              bucket,
              key,
              body: `racer-${index}`,
              condition: { etag: null },
            }),
          ),
        );
        const winners = outcomes.filter((o) => o.status === 'fulfilled');
        const losers = outcomes.filter(
          (o): o is PromiseRejectedResult => o.status === 'rejected',
        );
        return { winners, losers };
      });

      then('exactly one racer wins the key', () => {
        expect(scene.winners).toHaveLength(1);
      });

      then(
        'every loser surfaces a typed conditional error, never a raw fault',
        () => {
          expect(scene.losers.length).toEqual(racers - 1);
          for (const loser of scene.losers) {
            const isTyped =
              loser.reason instanceof S3PreconditionFailedError ||
              loser.reason instanceof S3ConditionalConflictError;
            expect(isTyped).toEqual(true);
          }
        },
      );
    },
  );
});
