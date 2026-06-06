import { given, then, when } from 'test-fns';
import { getUuid } from 'uuid-fns';

import { getTestBucket } from '../__test_assets__/getTestBucket';
import { del } from './del';
import { getOne } from './getOne';
import { set } from './set';

describe('del', () => {
  const bucket = getTestBucket();

  given('[case1] extant object', () => {
    const key = `test/${getUuid()}/to-delete.txt`;
    const content = `delete-me-${getUuid()}`;

    // setup: create the object
    beforeAll(async () => {
      await set({ bucket, key, body: content });
    });

    when('[t0] deleted', () => {
      then('object no longer exists', async () => {
        await del({ bucket, key });
        const result = await getOne({ bucket, key });
        expect(result).toBeNull();
      });
    });
  });

  given('[case2] absent object (idempotent)', () => {
    const key = `test/${getUuid()}/never-existed.txt`;

    when('[t0] deleted', () => {
      then('succeeds silently', async () => {
        // should not throw
        await del({ bucket, key });
        const result = await getOne({ bucket, key });
        expect(result).toBeNull();
      });
    });
  });

  given('[case3] uri format', () => {
    const key = `test/${getUuid()}/uri-delete.txt`;
    const content = `uri-delete-${getUuid()}`;

    // setup: create the object
    beforeAll(async () => {
      await set({ bucket, key, body: content });
    });

    when('[t0] deleted via uri', () => {
      then('object no longer exists', async () => {
        const uri = `s3://${bucket}/${key}`;
        await del({ uri });
        const result = await getOne({ bucket, key });
        expect(result).toBeNull();
      });
    });
  });
});
