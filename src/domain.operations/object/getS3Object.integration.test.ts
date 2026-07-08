import { given, then, useBeforeAll } from 'test-fns';
import { getUuid } from 'uuid-fns';

import { getTestBucket } from '../../__test_assets__/getTestBucket';
import { getS3Object } from './getS3Object';
import { setS3Object } from './setS3Object';

describe('getS3Object', () => {
  const bucket = getTestBucket();

  given('[case1] an extant object', () => {
    const key = `test/${getUuid()}/communicator-get.txt`;
    const body = `body-${getUuid()}`;

    const scene = useBeforeAll(async () => {
      await setS3Object({ ref: { bucket, key }, body, condition: null });
      return { got: await getS3Object({ ref: { bucket, key } }) };
    });

    then('it returns the body verbatim', () => {
      expect(scene.got?.body).toEqual(body);
    });

    then('it surfaces the s3 etag verbatim (quotes preserved)', () => {
      expect(scene.got?.etag).toEqual(expect.any(String));
      expect(scene.got?.etag).toMatch(/^".*"$/);
    });
  });

  given('[case2] an absent object', () => {
    const key = `test/${getUuid()}/communicator-get-absent.txt`;

    const scene = useBeforeAll(async () => ({
      got: await getS3Object({ ref: { bucket, key } }),
    }));

    then('a 404 maps to null at the boundary (not an error)', () => {
      expect(scene.got).toBeNull();
    });
  });
});
