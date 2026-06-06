import { given, then, when } from 'test-fns';
import { getUuid } from 'uuid-fns';

import { getTestBucket } from '../__test_assets__/getTestBucket';
import { getOne } from './getOne';
import { set } from './set';

describe('getOne', () => {
  const bucket = getTestBucket();

  given('[case1] object does not exist', () => {
    const key = `test/${getUuid()}/absent.txt`;

    when('[t0] fetched', () => {
      then('returns null', async () => {
        const result = await getOne({ bucket, key });
        expect(result).toBeNull();
      });
    });
  });

  given('[case2] object exists', () => {
    const key = `test/${getUuid()}/content.txt`;
    const content = `content-${getUuid()}`;

    // setup: create the object
    beforeAll(async () => {
      await set({ bucket, key, body: content });
    });

    when('[t0] fetched', () => {
      then('returns content', async () => {
        const result = await getOne({ bucket, key });
        expect(result).toEqual(content);
      });
    });
  });

  given('[case3] uri format', () => {
    const key = `test/${getUuid()}/uri-test.txt`;
    const content = `uri-content-${getUuid()}`;

    // setup: create the object
    beforeAll(async () => {
      await set({ bucket, key, body: content });
    });

    when('[t0] fetched via uri', () => {
      then('returns content', async () => {
        const uri = `s3://${bucket}/${key}`;
        const result = await getOne({ uri });
        expect(result).toEqual(content);
      });
    });
  });

  given('[case4] key with special chars', () => {
    const key = `test/${getUuid()}/path with spaces/file+name.txt`;
    const content = `special-${getUuid()}`;

    // setup: create the object
    beforeAll(async () => {
      await set({ bucket, key, body: content });
    });

    when('[t0] fetched', () => {
      then('returns content', async () => {
        const result = await getOne({ bucket, key });
        expect(result).toEqual(content);
      });
    });
  });
});
