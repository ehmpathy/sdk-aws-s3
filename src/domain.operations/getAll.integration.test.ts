import { given, then, when } from 'test-fns';
import { getUuid } from 'uuid-fns';

import { getTestBucket } from '../__test_assets__/getTestBucket';
import { getAll } from './getAll';
import { set } from './set';

describe('getAll', () => {
  const bucket = getTestBucket();

  given('[case1] multiple objects with prefix', () => {
    const prefix = `test/${getUuid()}/multi/`;
    const objects = [
      { key: `${prefix}a.txt`, content: `content-a-${getUuid()}` },
      { key: `${prefix}b.txt`, content: `content-b-${getUuid()}` },
      { key: `${prefix}c.txt`, content: `content-c-${getUuid()}` },
    ];

    // setup: create objects
    beforeAll(async () => {
      for (const obj of objects) {
        await set({ bucket, key: obj.key, body: obj.content });
      }
    });

    when('[t0] fetched', () => {
      then('returns all objects', async () => {
        const results = await getAll({ bucket, prefix });
        expect(results).toHaveLength(3);

        // verify all objects are present
        for (const obj of objects) {
          const found = results.find((r) => r.key === obj.key);
          expect(found).toBeDefined();
          expect(found?.content).toEqual(obj.content);
        }
      });
    });
  });

  given('[case2] empty prefix (no matches)', () => {
    const prefix = `test/${getUuid()}/empty-prefix/`;

    when('[t0] fetched', () => {
      then('returns empty array', async () => {
        const results = await getAll({ bucket, prefix });
        expect(results).toEqual([]);
      });
    });
  });

  given('[case3] uri format', () => {
    const prefix = `test/${getUuid()}/uri-multi/`;
    const objects = [
      { key: `${prefix}x.txt`, content: `x-${getUuid()}` },
      { key: `${prefix}y.txt`, content: `y-${getUuid()}` },
    ];

    // setup: create objects
    beforeAll(async () => {
      for (const obj of objects) {
        await set({ bucket, key: obj.key, body: obj.content });
      }
    });

    when('[t0] fetched via uri', () => {
      then('returns all objects', async () => {
        const uri = `s3://${bucket}/${prefix}`;
        const results = await getAll({ uri });
        expect(results).toHaveLength(2);
      });
    });
  });

  given('[case4] nested prefix', () => {
    const prefix = `test/${getUuid()}/nested/`;
    const objects = [
      { key: `${prefix}level1/file1.txt`, content: 'nested1' },
      { key: `${prefix}level1/level2/file2.txt`, content: 'nested2' },
    ];

    // setup: create objects
    beforeAll(async () => {
      for (const obj of objects) {
        await set({ bucket, key: obj.key, body: obj.content });
      }
    });

    when('[t0] fetched with parent prefix', () => {
      then('returns all nested objects', async () => {
        const results = await getAll({ bucket, prefix });
        expect(results).toHaveLength(2);
      });
    });
  });
});
