import { given, then, when } from 'test-fns';
import { getUuid } from 'uuid-fns';

import { getTestBucket } from '../__test_assets__/getTestBucket';
import { sdkAwsS3 } from './index';

describe('sdkAwsS3', () => {
  const bucket = getTestBucket();

  describe('get.one', () => {
    describe('via { bucket, key }', () => {
      given('[case1] object exists', () => {
        const key = `acceptance/${getUuid()}/content.txt`;
        const content = `acceptance-${getUuid()}`;

        beforeAll(async () => {
          await sdkAwsS3.set({ bucket, key, body: content });
        });

        when('[t0] fetched', () => {
          then('returns string content', async () => {
            const result = await sdkAwsS3.get.one({ bucket, key });
            expect(result).toEqual(content);
            expect(result).toMatchSnapshot();
          });
        });
      });

      given('[case2] object absent', () => {
        const key = `acceptance/${getUuid()}/absent.txt`;

        when('[t0] fetched', () => {
          then('returns null', async () => {
            const result = await sdkAwsS3.get.one({ bucket, key });
            expect(result).toBeNull();
            expect(result).toMatchSnapshot();
          });
        });
      });
    });

    describe('via { uri }', () => {
      given('[case1] object exists', () => {
        const key = `acceptance/${getUuid()}/uri-content.txt`;
        const uri = `s3://${bucket}/${key}`;
        const content = `acceptance-uri-${getUuid()}`;

        beforeAll(async () => {
          await sdkAwsS3.set({ uri, body: content });
        });

        when('[t0] fetched', () => {
          then('returns string content', async () => {
            const result = await sdkAwsS3.get.one({ uri });
            expect(result).toEqual(content);
            expect(result).toMatchSnapshot();
          });
        });
      });

      given('[case2] object absent', () => {
        const key = `acceptance/${getUuid()}/uri-absent.txt`;
        const uri = `s3://${bucket}/${key}`;

        when('[t0] fetched', () => {
          then('returns null', async () => {
            const result = await sdkAwsS3.get.one({ uri });
            expect(result).toBeNull();
            expect(result).toMatchSnapshot();
          });
        });
      });
    });
  });

  describe('get.all', () => {
    describe('via { bucket, prefix }', () => {
      given('[case1] objects with prefix', () => {
        const prefix = `acceptance/${getUuid()}/multi/`;
        const objects = [
          { key: `${prefix}a.txt`, content: 'a' },
          { key: `${prefix}b.txt`, content: 'b' },
        ];

        beforeAll(async () => {
          for (const obj of objects) {
            await sdkAwsS3.set({ bucket, key: obj.key, body: obj.content });
          }
        });

        when('[t0] fetched', () => {
          then('returns array shape', async () => {
            const result = await sdkAwsS3.get.all({ bucket, prefix });
            expect(result).toHaveLength(2);
            expect(
              result.map((r) => ({ key: r.key, content: r.content })),
            ).toEqual(
              expect.arrayContaining([
                { key: objects[0]!.key, content: 'a' },
                { key: objects[1]!.key, content: 'b' },
              ]),
            );
            expect(result.map((r) => r.content)).toMatchSnapshot();
          });
        });
      });

      given('[case2] no objects match prefix', () => {
        const prefix = `acceptance/${getUuid()}/empty/`;

        when('[t0] fetched', () => {
          then('returns empty array', async () => {
            const result = await sdkAwsS3.get.all({ bucket, prefix });
            expect(result).toEqual([]);
            expect(result).toMatchSnapshot();
          });
        });
      });
    });

    describe('via { uri }', () => {
      given('[case1] objects with prefix', () => {
        const prefix = `acceptance/${getUuid()}/uri-multi/`;
        const uri = `s3://${bucket}/${prefix}`;
        const objects = [
          { key: `${prefix}c.txt`, content: 'c' },
          { key: `${prefix}d.txt`, content: 'd' },
        ];

        beforeAll(async () => {
          for (const obj of objects) {
            await sdkAwsS3.set({ bucket, key: obj.key, body: obj.content });
          }
        });

        when('[t0] fetched', () => {
          then('returns array shape', async () => {
            const result = await sdkAwsS3.get.all({ uri });
            expect(result).toHaveLength(2);
            expect(
              result.map((r) => ({ key: r.key, content: r.content })),
            ).toEqual(
              expect.arrayContaining([
                { key: objects[0]!.key, content: 'c' },
                { key: objects[1]!.key, content: 'd' },
              ]),
            );
            expect(result.map((r) => r.content)).toMatchSnapshot();
          });
        });
      });

      given('[case2] no objects match prefix', () => {
        const prefix = `acceptance/${getUuid()}/uri-empty/`;
        const uri = `s3://${bucket}/${prefix}`;

        when('[t0] fetched', () => {
          then('returns empty array', async () => {
            const result = await sdkAwsS3.get.all({ uri });
            expect(result).toEqual([]);
            expect(result).toMatchSnapshot();
          });
        });
      });
    });
  });

  describe('set', () => {
    describe('via { bucket, key }', () => {
      given('[case1] new object', () => {
        const key = `acceptance/${getUuid()}/set.txt`;

        when('[t0] set', () => {
          then('returns void', async () => {
            const result = await sdkAwsS3.set({ bucket, key, body: 'content' });
            expect(result).toBeUndefined();
            expect(result).toMatchSnapshot();
          });
        });
      });

      given('[case2] overwrite extant object', () => {
        const key = `acceptance/${getUuid()}/overwrite.txt`;
        const contentBefore = 'before';
        const contentAfter = 'after';

        beforeAll(async () => {
          await sdkAwsS3.set({ bucket, key, body: contentBefore });
        });

        when('[t0] overwritten', () => {
          then('returns void and content updated', async () => {
            const result = await sdkAwsS3.set({
              bucket,
              key,
              body: contentAfter,
            });
            expect(result).toBeUndefined();
            const fetched = await sdkAwsS3.get.one({ bucket, key });
            expect(fetched).toEqual(contentAfter);
          });
        });
      });
    });

    describe('via { uri }', () => {
      given('[case1] new object', () => {
        const key = `acceptance/${getUuid()}/uri-set.txt`;
        const uri = `s3://${bucket}/${key}`;

        when('[t0] set', () => {
          then('returns void', async () => {
            const result = await sdkAwsS3.set({ uri, body: 'uri-content' });
            expect(result).toBeUndefined();
            expect(result).toMatchSnapshot();
          });
        });
      });

      given('[case2] overwrite extant object', () => {
        const key = `acceptance/${getUuid()}/uri-overwrite.txt`;
        const uri = `s3://${bucket}/${key}`;
        const contentBefore = 'uri-before';
        const contentAfter = 'uri-after';

        beforeAll(async () => {
          await sdkAwsS3.set({ uri, body: contentBefore });
        });

        when('[t0] overwritten', () => {
          then('returns void and content updated', async () => {
            const result = await sdkAwsS3.set({ uri, body: contentAfter });
            expect(result).toBeUndefined();
            const fetched = await sdkAwsS3.get.one({ uri });
            expect(fetched).toEqual(contentAfter);
          });
        });
      });
    });
  });

  describe('del', () => {
    describe('via { bucket, key }', () => {
      given('[case1] object to delete', () => {
        const key = `acceptance/${getUuid()}/del.txt`;

        beforeAll(async () => {
          await sdkAwsS3.set({ bucket, key, body: 'to-delete' });
        });

        when('[t0] deleted', () => {
          then('returns void', async () => {
            const result = await sdkAwsS3.del({ bucket, key });
            expect(result).toBeUndefined();
            expect(result).toMatchSnapshot();
          });
        });
      });

      given('[case2] delete absent object (idempotent)', () => {
        const key = `acceptance/${getUuid()}/absent-delete.txt`;

        when('[t0] deleted', () => {
          then('returns void without error', async () => {
            const result = await sdkAwsS3.del({ bucket, key });
            expect(result).toBeUndefined();
            expect(result).toMatchSnapshot();
          });
        });
      });
    });

    describe('via { uri }', () => {
      given('[case1] object to delete', () => {
        const key = `acceptance/${getUuid()}/uri-del.txt`;
        const uri = `s3://${bucket}/${key}`;

        beforeAll(async () => {
          await sdkAwsS3.set({ uri, body: 'uri-to-delete' });
        });

        when('[t0] deleted', () => {
          then('returns void', async () => {
            const result = await sdkAwsS3.del({ uri });
            expect(result).toBeUndefined();
            expect(result).toMatchSnapshot();
          });
        });
      });

      given('[case2] delete absent object (idempotent)', () => {
        const key = `acceptance/${getUuid()}/uri-absent-delete.txt`;
        const uri = `s3://${bucket}/${key}`;

        when('[t0] deleted', () => {
          then('returns void without error', async () => {
            const result = await sdkAwsS3.del({ uri });
            expect(result).toBeUndefined();
            expect(result).toMatchSnapshot();
          });
        });
      });
    });
  });

  describe('errors', () => {
    given('[case1] invalid uri scheme', () => {
      when('[t0] parsed', () => {
        then('throws error', async () => {
          await expect(
            sdkAwsS3.get.one({ uri: 'http://bucket/key' }),
          ).rejects.toThrow('invalid s3 uri scheme');
        });
      });
    });

    given('[case2] malformed uri', () => {
      when('[t0] parsed', () => {
        then('throws error', async () => {
          await expect(
            sdkAwsS3.get.one({ uri: 's3://bucket' }),
          ).rejects.toThrow('malformed s3 uri');
        });
      });
    });
  });
});
