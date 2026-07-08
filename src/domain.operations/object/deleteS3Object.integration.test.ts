import { getError } from 'helpful-errors';
import { given, then, useBeforeAll } from 'test-fns';
import { getUuid } from 'uuid-fns';

import { getTestBucket } from '../../__test_assets__/getTestBucket';
import { S3PreconditionFailedError } from '../../domain.objects/S3PreconditionFailedError';
import { deleteS3Object } from './deleteS3Object';
import { getS3Object } from './getS3Object';
import { setS3Object } from './setS3Object';

describe('deleteS3Object', () => {
  const bucket = getTestBucket();

  given('[case1] unconditional delete of an extant object', () => {
    const key = `test/${getUuid()}/communicator-del.txt`;

    const scene = useBeforeAll(async () => {
      await setS3Object({
        ref: { bucket, key },
        body: 'gone-soon',
        condition: null,
      });
      await deleteS3Object({ ref: { bucket, key }, condition: null });
      return { got: await getS3Object({ ref: { bucket, key } }) };
    });

    then('the object is removed', () => {
      expect(scene.got).toBeNull();
    });
  });

  given(
    '[case2] compare-and-delete condition maps a breach to a typed error',
    () => {
      const key = `test/${getUuid()}/communicator-cad-stale.txt`;

      const scene = useBeforeAll(async () => {
        await setS3Object({
          ref: { bucket, key },
          body: 'keep-me',
          condition: null,
        });
        const error = await getError(
          deleteS3Object({
            ref: { bucket, key },
            condition: { etag: '"deadbeefdeadbeefdeadbeefdeadbeef"' },
          }),
        );
        return { error, got: await getS3Object({ ref: { bucket, key } }) };
      });

      then('the boundary error-map raises S3PreconditionFailedError', () => {
        expect(scene.error).toBeInstanceOf(S3PreconditionFailedError);
      });

      then('the object is left untouched', () => {
        expect(scene.got?.body).toEqual('keep-me');
      });
    },
  );
});
