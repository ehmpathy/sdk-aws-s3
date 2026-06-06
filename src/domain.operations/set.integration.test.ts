import { given, then, when } from 'test-fns';
import { getUuid } from 'uuid-fns';

import { getTestBucket } from '../__test_assets__/getTestBucket';
import { getOne } from './getOne';
import { set } from './set';

describe('set', () => {
  const bucket = getTestBucket();

  given('[case1] new object', () => {
    const key = `test/${getUuid()}/new-object.txt`;
    const content = `new-content-${getUuid()}`;

    when('[t0] set', () => {
      then('creates object', async () => {
        await set({ bucket, key, body: content });
        const result = await getOne({ bucket, key });
        expect(result).toEqual(content);
      });
    });
  });

  given('[case2] overwrite extant object', () => {
    const key = `test/${getUuid()}/overwrite.txt`;
    const contentBefore = `before-${getUuid()}`;
    const contentAfter = `after-${getUuid()}`;

    // setup: create the object
    beforeAll(async () => {
      await set({ bucket, key, body: contentBefore });
    });

    when('[t0] set with new content', () => {
      then('overwrites content', async () => {
        await set({ bucket, key, body: contentAfter });
        const result = await getOne({ bucket, key });
        expect(result).toEqual(contentAfter);
      });
    });
  });

  given('[case3] uri format', () => {
    const key = `test/${getUuid()}/uri-set.txt`;
    const content = `uri-set-${getUuid()}`;

    when('[t0] set via uri', () => {
      then('creates object', async () => {
        const uri = `s3://${bucket}/${key}`;
        await set({ uri, body: content });
        const result = await getOne({ bucket, key });
        expect(result).toEqual(content);
      });
    });
  });

  given('[case4] empty body', () => {
    const key = `test/${getUuid()}/empty.txt`;

    when('[t0] set with empty body', () => {
      then('creates object with empty content', async () => {
        await set({ bucket, key, body: '' });
        const result = await getOne({ bucket, key });
        expect(result).toEqual('');
      });
    });
  });
});
