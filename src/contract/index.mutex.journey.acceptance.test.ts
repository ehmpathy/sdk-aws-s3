import { getError } from 'helpful-errors';
import { given, then, useBeforeAll, when } from 'test-fns';
import { getUuid } from 'uuid-fns';

import { getTestBucket } from '../__test_assets__/getTestBucket';
import { S3PreconditionFailedError, sdkAwsS3 } from './index';

// the wish's core feature as one consolidated journey over a single mutex key:
// unheld → acquire (put-if-absent, capture the fence token) → blocked second acquirer →
// fenced release (compare-and-delete) → re-acquire. the whole sequence runs once in
// useBeforeAll; each checkpoint is asserted in its own then (no redundant s3 calls).
describe('sdkAwsS3 mutex journey', () => {
  const bucket = getTestBucket();
  const key = `mutex/${getUuid()}/lock.txt`;

  given('[journey] a single mutex key over its lifecycle', () => {
    const scene = useBeforeAll(async () => {
      // t0 — the lock is unheld
      const unheld = await sdkAwsS3.get.one({ bucket, key });

      // t1 — a holder acquires via put-if-absent; the fence token is the returned etag
      const acquired = await sdkAwsS3.set({
        bucket,
        key,
        body: 'holder-1',
        condition: { etag: null },
        include: { meta: true },
      });

      // t2 — a second acquirer races for the held lock and is blocked
      const blocked = await getError(
        sdkAwsS3.set({
          bucket,
          key,
          body: 'holder-2',
          condition: { etag: null },
        }),
      );

      // t3 — the holder releases via a fenced compare-and-delete
      await sdkAwsS3.del({
        bucket,
        key,
        condition: { etag: acquired.meta.etag },
      });
      const afterRelease = await sdkAwsS3.get.one({ bucket, key });

      // t4 — a new holder re-acquires the freed lock
      const reacquired = await sdkAwsS3.set({
        bucket,
        key,
        body: 'holder-3',
        condition: { etag: null },
        include: { meta: true },
      });

      return { unheld, acquired, blocked, afterRelease, reacquired };
    });

    when('[t0] the lock is unheld', () => {
      then('get.one returns null', () => {
        expect(scene.unheld).toBeNull();
      });
    });

    when('[t1] a holder acquires the lock via put-if-absent', () => {
      then('it returns a fence token (etag)', () => {
        expect(scene.acquired.meta.etag).toEqual(expect.any(String));
      });

      then('the acquire envelope shape is locked', () => {
        // property matcher keeps the shape snapshot deterministic (etag is a live s3 value)
        expect(scene.acquired).toMatchSnapshot({
          meta: { etag: expect.any(String) },
        });
      });
    });

    when('[t2] a second acquirer races for the held lock', () => {
      then('it throws a typed S3PreconditionFailedError', () => {
        expect(scene.blocked).toBeInstanceOf(S3PreconditionFailedError);
      });

      then('the blocked-checkpoint message is clear and locked', () => {
        // swap the random key for a stable token so the message snapshot is deterministic
        const message = (scene.blocked as Error).message
          .split(key)
          .join('<key>');
        expect(message).toContain('s3 precondition failed');
        expect(message).toMatchSnapshot();
      });
    });

    when('[t3] the holder releases via a fenced compare-and-delete', () => {
      then('the fenced release freed the lock', () => {
        expect(scene.afterRelease).toBeNull();
      });

      then('the post-release absent state is locked', () => {
        expect(scene.afterRelease).toBeNull();
        expect(scene.afterRelease).toMatchSnapshot();
      });
    });

    when('[t4] a new holder re-acquires the freed lock', () => {
      then('put-if-absent succeeds again with a fresh fence token', () => {
        expect(scene.reacquired.meta.etag).toEqual(expect.any(String));
      });

      then('the re-acquire envelope shape is locked', () => {
        // property matcher keeps the shape snapshot deterministic (etag is a live s3 value)
        expect(scene.reacquired).toMatchSnapshot({
          meta: { etag: expect.any(String) },
        });
      });
    });
  });
});
