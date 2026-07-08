import {
  DeleteObjectCommand,
  type GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { given, then, useBeforeAll, when } from 'test-fns';
import { getUuid } from 'uuid-fns';

import { getTestBucket } from '../__test_assets__/getTestBucket';
import { getAll } from './getAll';
import { set } from './set';

describe('getAll', () => {
  const bucket = getTestBucket();

  given('[case1] multiple objects with prefix', () => {
    const prefix = `test/${getUuid()}/multi/`;
    const objects = [
      { key: `${prefix}a.txt`, body: `body-a-${getUuid()}` },
      { key: `${prefix}b.txt`, body: `body-b-${getUuid()}` },
      { key: `${prefix}c.txt`, body: `body-c-${getUuid()}` },
    ];

    // setup: create objects
    beforeAll(async () => {
      for (const obj of objects) {
        await set({ bucket, key: obj.key, body: obj.body });
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
          expect(found?.body).toEqual(obj.body);
          // guard the content → body rename: a regression that re-introduces `content`
          // must fail here, before release (not only at the commit-prefix convention)
          expect(found).not.toHaveProperty('content');
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
      { key: `${prefix}x.txt`, body: `x-${getUuid()}` },
      { key: `${prefix}y.txt`, body: `y-${getUuid()}` },
    ];

    // setup: create objects
    beforeAll(async () => {
      for (const obj of objects) {
        await set({ bucket, key: obj.key, body: obj.body });
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
      { key: `${prefix}level1/file1.txt`, body: 'nested1' },
      { key: `${prefix}level1/level2/file2.txt`, body: 'nested2' },
    ];

    // setup: create objects
    beforeAll(async () => {
      for (const obj of objects) {
        await set({ bucket, key: obj.key, body: obj.body });
      }
    });

    when('[t0] fetched with parent prefix', () => {
      then('returns all nested objects', async () => {
        const results = await getAll({ bucket, prefix });
        expect(results).toHaveLength(2);
      });
    });
  });

  given('[case5] a key is deleted between the list and the fetch', () => {
    // pins the deliberate eventual-consistency drop: list + get is a two-step read, so a key
    // can vanish in the window between the two. getAll must yield the objects present at
    // fetch time (no throw). we reproduce the race deterministically with a real spy on the
    // injected client that deletes one key right after the prefix is listed — every response
    // stays real s3; the spy only times a real delete (it does not fake any response).
    const prefix = `test/${getUuid()}/toctou/`;
    const keyStable = `${prefix}stable.txt`;
    const keyVanish = `${prefix}vanish.txt`;

    const scene = useBeforeAll(async () => {
      const client = new S3Client({});
      const context = { aws: { s3: { client } } };
      await set({ bucket, key: keyStable, body: 'stable' }, context);
      await set({ bucket, key: keyVanish, body: 'vanish' }, context);

      // after the prefix is listed, delete keyVanish before its body is fetched.
      // each command is narrowed before the send call, so the passthrough stays cast-free
      // per-call; a single documented cast wraps the whole impl, since the aws-sdk `send` is
      // overloaded (promise + callback forms) and jest can not infer a passthrough spy over
      // it otherwise. this is the external-boundary exception to rule.forbid.as-cast; every
      // response stays real s3 (the spy only times a real delete). removal path: adopt
      // client.middlewareStack if aws keeps the overload.
      const sendActual = client.send.bind(client);
      let vanished = false;
      const sendPassthrough = async (
        command: ListObjectsV2Command | GetObjectCommand,
      ): Promise<unknown> => {
        // a listed prefix → let it through, then delete keyVanish before its body is fetched
        if (command instanceof ListObjectsV2Command) {
          const result = await sendActual(command);
          if (!vanished) {
            vanished = true;
            await sendActual(
              new DeleteObjectCommand({ Bucket: bucket, Key: keyVanish }),
            );
          }
          return result;
        }

        // a body fetch → pass through untouched (keyVanish now 404s → dropped)
        return sendActual(command);
      };
      jest
        .spyOn(client, 'send')
        .mockImplementation(sendPassthrough as typeof client.send);

      const results = await getAll({ bucket, prefix }, context);
      return { keys: results.map((r) => r.key) };
    });

    when('[t0] fetched while one listed key vanishes mid-fetch', () => {
      then(
        'the vanished key is omitted, the rest are yielded (no throw)',
        () => {
          expect(scene.keys).toEqual([keyStable]);
        },
      );
    });
  });
});
