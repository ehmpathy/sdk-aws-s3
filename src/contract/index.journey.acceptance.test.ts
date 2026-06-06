import { given, then, when } from 'test-fns';
import { getUuid } from 'uuid-fns';

import { getTestBucket } from '../__test_assets__/getTestBucket';
import { sdkAwsS3 } from './index';

describe('sdkAwsS3 journey', () => {
  const bucket = getTestBucket();
  const prefix = `journey/${getUuid()}/`;
  const keyA = `${prefix}a.txt`;
  const keyB = `${prefix}b.txt`;

  given('[journey] full lifecycle via bucket/key', () => {
    when('[t0] objects absent', () => {
      then('get.one returns null', async () => {
        const result = await sdkAwsS3.get.one({ bucket, key: keyA });
        expect(result).toBeNull();
        expect(result).toMatchSnapshot();
      });

      then('get.all returns empty', async () => {
        const result = await sdkAwsS3.get.all({ bucket, prefix });
        expect(result).toEqual([]);
        expect(result).toMatchSnapshot();
      });
    });

    when('[t1] first object created', () => {
      then('get.one returns content', async () => {
        await sdkAwsS3.set({ bucket, key: keyA, body: 'content-a' });
        const result = await sdkAwsS3.get.one({ bucket, key: keyA });
        expect(result).toEqual('content-a');
        expect(result).toMatchSnapshot();
      });

      then('get.all returns one object', async () => {
        const result = await sdkAwsS3.get.all({ bucket, prefix });
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ key: keyA, content: 'content-a' });
        expect(result).toMatchSnapshot();
      });
    });

    when('[t2] second object created', () => {
      then('get.all returns both objects', async () => {
        await sdkAwsS3.set({ bucket, key: keyB, body: 'content-b' });
        const result = await sdkAwsS3.get.all({ bucket, prefix });
        expect(result).toHaveLength(2);
        expect(result.map((r) => r.content).sort()).toEqual([
          'content-a',
          'content-b',
        ]);
        expect(result).toMatchSnapshot();
      });
    });

    when('[t3] object updated', () => {
      then('get.one returns updated content', async () => {
        await sdkAwsS3.set({ bucket, key: keyA, body: 'content-a-updated' });
        const result = await sdkAwsS3.get.one({ bucket, key: keyA });
        expect(result).toEqual('content-a-updated');
        expect(result).toMatchSnapshot();
      });
    });

    when('[t4] object deleted', () => {
      then('get.one returns null', async () => {
        await sdkAwsS3.del({ bucket, key: keyA });
        const result = await sdkAwsS3.get.one({ bucket, key: keyA });
        expect(result).toBeNull();
        expect(result).toMatchSnapshot();
      });

      then('get.all returns other object', async () => {
        const result = await sdkAwsS3.get.all({ bucket, prefix });
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ key: keyB, content: 'content-b' });
        expect(result).toMatchSnapshot();
      });
    });

    when('[t5] cleanup', () => {
      then('last object deleted', async () => {
        await sdkAwsS3.del({ bucket, key: keyB });
        const result = await sdkAwsS3.get.all({ bucket, prefix });
        expect(result).toEqual([]);
      });
    });
  });

  given('[journey] full lifecycle via uri', () => {
    const uriPrefix = `journey/${getUuid()}/`;
    const uriKeyC = `${uriPrefix}c.txt`;
    const uriKeyD = `${uriPrefix}d.txt`;
    const uriC = `s3://${bucket}/${uriKeyC}`;
    const uriD = `s3://${bucket}/${uriKeyD}`;
    const uriPrefixFull = `s3://${bucket}/${uriPrefix}`;

    when('[t0] objects absent', () => {
      then('get.one returns null', async () => {
        const result = await sdkAwsS3.get.one({ uri: uriC });
        expect(result).toBeNull();
        expect(result).toMatchSnapshot();
      });

      then('get.all returns empty', async () => {
        const result = await sdkAwsS3.get.all({ uri: uriPrefixFull });
        expect(result).toEqual([]);
        expect(result).toMatchSnapshot();
      });
    });

    when('[t1] objects created via uri', () => {
      then('get.one returns content', async () => {
        await sdkAwsS3.set({ uri: uriC, body: 'content-c' });
        await sdkAwsS3.set({ uri: uriD, body: 'content-d' });
        const result = await sdkAwsS3.get.one({ uri: uriC });
        expect(result).toEqual('content-c');
        expect(result).toMatchSnapshot();
      });

      then('get.all returns both', async () => {
        const result = await sdkAwsS3.get.all({ uri: uriPrefixFull });
        expect(result).toHaveLength(2);
        expect(result.map((r) => r.content).sort()).toEqual([
          'content-c',
          'content-d',
        ]);
        expect(result).toMatchSnapshot();
      });
    });

    when('[t2] object deleted via uri', () => {
      then('get.one returns null', async () => {
        await sdkAwsS3.del({ uri: uriC });
        const result = await sdkAwsS3.get.one({ uri: uriC });
        expect(result).toBeNull();
        expect(result).toMatchSnapshot();
      });
    });

    when('[t3] cleanup', () => {
      then('last object deleted', async () => {
        await sdkAwsS3.del({ uri: uriD });
        const result = await sdkAwsS3.get.all({ uri: uriPrefixFull });
        expect(result).toEqual([]);
      });
    });
  });

  given('[journey] error cases', () => {
    when('[t0] invalid uri scheme', () => {
      then('get.one throws', async () => {
        await expect(
          sdkAwsS3.get.one({ uri: 'http://bucket/key' }),
        ).rejects.toThrow('invalid s3 uri scheme');
      });

      then('set throws', async () => {
        await expect(
          sdkAwsS3.set({ uri: 'http://bucket/key', body: 'x' }),
        ).rejects.toThrow('invalid s3 uri scheme');
      });

      then('del throws', async () => {
        await expect(
          sdkAwsS3.del({ uri: 'http://bucket/key' }),
        ).rejects.toThrow('invalid s3 uri scheme');
      });
    });

    when('[t1] malformed uri', () => {
      then('get.one throws', async () => {
        await expect(sdkAwsS3.get.one({ uri: 's3://bucket' })).rejects.toThrow(
          'malformed s3 uri',
        );
      });
    });
  });
});
