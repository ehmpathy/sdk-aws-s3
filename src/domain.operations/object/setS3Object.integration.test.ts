import { getError } from 'helpful-errors';
import { given, then, useBeforeAll } from 'test-fns';
import { getUuid } from 'uuid-fns';

import { getTestBucket } from '../../__test_assets__/getTestBucket';
import { S3PreconditionFailedError } from '../../domain.objects/S3PreconditionFailedError';
import { setS3Object } from './setS3Object';

describe('setS3Object', () => {
  const bucket = getTestBucket();

  given('[case1] unconditional put at the raw boundary', () => {
    const key = `test/${getUuid()}/communicator-put.txt`;

    const scene = useBeforeAll(async () => ({
      response: await setS3Object({
        ref: { bucket, key },
        body: `body-${getUuid()}`,
        condition: null,
      }),
    }));

    then('s3 returns a put output that holds an etag', () => {
      expect(scene.response.ETag).toEqual(expect.any(String));
    });
  });

  given(
    '[case2] put-if-absent condition maps a breach to a typed error',
    () => {
      const key = `test/${getUuid()}/communicator-put-if-absent.txt`;

      const scene = useBeforeAll(async () => {
        // seed the object so the put-if-absent breaches its precondition
        await setS3Object({
          ref: { bucket, key },
          body: 'first',
          condition: null,
        });
        const error = await getError(
          setS3Object({
            ref: { bucket, key },
            body: 'second',
            condition: { etag: null },
          }),
        );
        return { error };
      });

      then('the boundary error-map raises S3PreconditionFailedError', () => {
        expect(scene.error).toBeInstanceOf(S3PreconditionFailedError);
      });
    },
  );
});
