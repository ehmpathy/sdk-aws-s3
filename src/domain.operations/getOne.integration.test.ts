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
    const key = `test/${getUuid()}/body.txt`;
    const body = `body-${getUuid()}`;

    // setup: create the object
    beforeAll(async () => {
      await set({ bucket, key, body: body });
    });

    when('[t0] fetched', () => {
      then('returns body', async () => {
        const result = await getOne({ bucket, key });
        expect(result).toEqual(body);
      });
    });
  });

  given('[case3] uri format', () => {
    const key = `test/${getUuid()}/uri-test.txt`;
    const body = `uri-body-${getUuid()}`;

    // setup: create the object
    beforeAll(async () => {
      await set({ bucket, key, body: body });
    });

    when('[t0] fetched via uri', () => {
      then('returns body', async () => {
        const uri = `s3://${bucket}/${key}`;
        const result = await getOne({ uri });
        expect(result).toEqual(body);
      });
    });
  });

  given('[case5] object exists with an empty (0-byte) body', () => {
    // pins the absent-vs-empty distinction (i6 r11.5): a present 0-byte object must read as
    // the empty string '', not null — null is reserved for "key does not exist".
    const key = `test/${getUuid()}/empty.txt`;

    // setup: create a 0-byte object
    beforeAll(async () => {
      await set({ bucket, key, body: '' });
    });

    when('[t0] fetched', () => {
      then('returns the empty string, not null', async () => {
        const result = await getOne({ bucket, key });
        expect(result).toEqual('');
        expect(result).not.toBeNull();
      });
    });
  });

  given('[case4] key with special chars', () => {
    const key = `test/${getUuid()}/path with spaces/file+name.txt`;
    const body = `special-${getUuid()}`;

    // setup: create the object
    beforeAll(async () => {
      await set({ bucket, key, body: body });
    });

    when('[t0] fetched', () => {
      then('returns body', async () => {
        const result = await getOne({ bucket, key });
        expect(result).toEqual(body);
      });
    });
  });
});
