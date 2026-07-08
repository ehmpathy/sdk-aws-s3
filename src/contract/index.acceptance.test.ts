import { getError, MalfunctionError } from 'helpful-errors';
import { given, then, useBeforeAll, when } from 'test-fns';
import { getUuid } from 'uuid-fns';

import { getTestBucket } from '../__test_assets__/getTestBucket';
import {
  S3ConditionalConflictError,
  S3PreconditionFailedError,
  sdkAwsS3,
} from './index';

describe('sdkAwsS3', () => {
  const bucket = getTestBucket();

  describe('get.one', () => {
    describe('via { bucket, key }', () => {
      given('[case1] object exists', () => {
        const key = `acceptance/${getUuid()}/body.txt`;
        // fixed body keeps the snapshot deterministic; the unique key isolates the run
        const body = 'acceptance-text';

        beforeAll(async () => {
          await sdkAwsS3.set({ bucket, key, body: body });
        });

        when('[t0] fetched', () => {
          then('returns string body', async () => {
            const result = await sdkAwsS3.get.one({ bucket, key });
            expect(result).toEqual(body);
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
        const key = `acceptance/${getUuid()}/uri-body.txt`;
        const uri = `s3://${bucket}/${key}`;
        // fixed body keeps the snapshot deterministic; the unique key isolates the run
        const body = 'acceptance-uri-text';

        beforeAll(async () => {
          await sdkAwsS3.set({ uri, body: body });
        });

        when('[t0] fetched', () => {
          then('returns string body', async () => {
            const result = await sdkAwsS3.get.one({ uri });
            expect(result).toEqual(body);
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
          { key: `${prefix}a.txt`, body: 'a' },
          { key: `${prefix}b.txt`, body: 'b' },
        ];

        beforeAll(async () => {
          for (const obj of objects) {
            await sdkAwsS3.set({ bucket, key: obj.key, body: obj.body });
          }
        });

        when('[t0] fetched', () => {
          then('returns array shape', async () => {
            const result = await sdkAwsS3.get.all({ bucket, prefix });
            expect(result).toHaveLength(2);
            expect(result.map((r) => ({ key: r.key, body: r.body }))).toEqual(
              expect.arrayContaining([
                { key: objects[0]!.key, body: 'a' },
                { key: objects[1]!.key, body: 'b' },
              ]),
            );
            expect(result.map((r) => r.body)).toMatchSnapshot();
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
          { key: `${prefix}c.txt`, body: 'c' },
          { key: `${prefix}d.txt`, body: 'd' },
        ];

        beforeAll(async () => {
          for (const obj of objects) {
            await sdkAwsS3.set({ bucket, key: obj.key, body: obj.body });
          }
        });

        when('[t0] fetched', () => {
          then('returns array shape', async () => {
            const result = await sdkAwsS3.get.all({ uri });
            expect(result).toHaveLength(2);
            expect(result.map((r) => ({ key: r.key, body: r.body }))).toEqual(
              expect.arrayContaining([
                { key: objects[0]!.key, body: 'c' },
                { key: objects[1]!.key, body: 'd' },
              ]),
            );
            expect(result.map((r) => r.body)).toMatchSnapshot();
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
            const result = await sdkAwsS3.set({
              bucket,
              key,
              body: 'body',
            });
            expect(result).toBeUndefined();
            expect(result).toMatchSnapshot();
          });
        });
      });

      given('[case2] overwrite extant object', () => {
        const key = `acceptance/${getUuid()}/overwrite.txt`;
        const bodyBefore = 'before';
        const bodyAfter = 'after';

        beforeAll(async () => {
          await sdkAwsS3.set({ bucket, key, body: bodyBefore });
        });

        when('[t0] overwritten', () => {
          then('returns void and body updated', async () => {
            const result = await sdkAwsS3.set({
              bucket,
              key,
              body: bodyAfter,
            });
            expect(result).toBeUndefined();
            const fetched = await sdkAwsS3.get.one({ bucket, key });
            expect(fetched).toEqual(bodyAfter);
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
            const result = await sdkAwsS3.set({ uri, body: 'uri-body' });
            expect(result).toBeUndefined();
            expect(result).toMatchSnapshot();
          });
        });
      });

      given('[case2] overwrite extant object', () => {
        const key = `acceptance/${getUuid()}/uri-overwrite.txt`;
        const uri = `s3://${bucket}/${key}`;
        const bodyBefore = 'uri-before';
        const bodyAfter = 'uri-after';

        beforeAll(async () => {
          await sdkAwsS3.set({ uri, body: bodyBefore });
        });

        when('[t0] overwritten', () => {
          then('returns void and body updated', async () => {
            const result = await sdkAwsS3.set({ uri, body: bodyAfter });
            expect(result).toBeUndefined();
            const fetched = await sdkAwsS3.get.one({ uri });
            expect(fetched).toEqual(bodyAfter);
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

  describe('conditional writes', () => {
    given('[case1] put-if-absent via condition.etag=null', () => {
      when('[t0] the object is absent', () => {
        const key = `acceptance/${getUuid()}/put-if-absent.txt`;

        const scene = useBeforeAll(async () => {
          const written = await sdkAwsS3.set({
            bucket,
            key,
            body: 'locked',
            condition: { etag: null },
            include: { meta: true },
          });
          return { written };
        });

        then('the write succeeds and returns a meta etag', () => {
          expect(scene.written.meta.etag).toEqual(expect.any(String));
        });

        then('the meta envelope shape is locked', () => {
          // property matcher keeps the shape snapshot deterministic (etag is a live s3 value)
          expect(scene.written).toMatchSnapshot({
            meta: { etag: expect.any(String) },
          });
        });
      });

      when('[t1] the object already exists', () => {
        const key = `acceptance/${getUuid()}/put-if-absent-exists.txt`;

        const scene = useBeforeAll(async () => {
          await sdkAwsS3.set({ bucket, key, body: 'first' });
          const error = await getError(
            sdkAwsS3.set({
              bucket,
              key,
              body: 'second',
              condition: { etag: null },
            }),
          );
          return { error };
        });

        then('it throws a typed S3PreconditionFailedError', () => {
          expect(scene.error).toBeInstanceOf(S3PreconditionFailedError);
        });

        then('the precondition error message is clear and actionable', () => {
          // swap every random-key occurrence for a stable token so the message snapshot is deterministic
          const message = (scene.error as Error).message
            .split(key)
            .join('<key>');
          expect(message).toMatchSnapshot();
        });
      });
    });

    given(
      '[case2] compare-and-set via condition.etag (optimistic concurrency)',
      () => {
        when('[t0] the etag matches the current version', () => {
          const key = `acceptance/${getUuid()}/cas-match.txt`;

          const scene = useBeforeAll(async () => {
            const written = await sdkAwsS3.set({
              bucket,
              key,
              body: 'v1',
              include: { meta: true },
            });
            await sdkAwsS3.set({
              bucket,
              key,
              body: 'v2',
              condition: { etag: written.meta.etag },
            });
            return { found: await sdkAwsS3.get.one({ bucket, key }) };
          });

          then('the write-back overwrites with the new body', () => {
            expect(scene.found).toEqual('v2');
          });

          then('the overwritten body is locked', () => {
            expect(scene.found).toEqual('v2');
            expect(scene.found).toMatchSnapshot();
          });
        });

        when('[t1] the etag is stale', () => {
          const key = `acceptance/${getUuid()}/cas-stale.txt`;

          const scene = useBeforeAll(async () => {
            await sdkAwsS3.set({ bucket, key, body: 'v1' });
            const error = await getError(
              sdkAwsS3.set({
                bucket,
                key,
                body: 'v2',
                condition: { etag: '"deadbeefdeadbeefdeadbeefdeadbeef"' },
              }),
            );
            return { error, found: await sdkAwsS3.get.one({ bucket, key }) };
          });

          then('it throws a typed S3PreconditionFailedError', () => {
            expect(scene.error).toBeInstanceOf(S3PreconditionFailedError);
          });

          then('the precondition error message is clear and actionable', () => {
            // swap every random-key occurrence for a stable token so the message snapshot is deterministic
            const message = (scene.error as Error).message
              .split(key)
              .join('<key>');
            expect(message).toContain('s3 precondition failed');
            expect(message).toMatchSnapshot();
          });

          then('the object still holds the original body', () => {
            expect(scene.found).toEqual('v1');
          });
        });
      },
    );

    given('[case3] compare-and-delete via condition.etag', () => {
      when('[t0] the etag matches', () => {
        const key = `acceptance/${getUuid()}/fenced-delete.txt`;

        const scene = useBeforeAll(async () => {
          const written = await sdkAwsS3.set({
            bucket,
            key,
            body: 'mine',
            include: { meta: true },
          });
          await sdkAwsS3.del({
            bucket,
            key,
            condition: { etag: written.meta.etag },
          });
          return { found: await sdkAwsS3.get.one({ bucket, key }) };
        });

        then('the object is gone', () => {
          expect(scene.found).toBeNull();
        });

        then('the post-delete absent result is locked', () => {
          expect(scene.found).toBeNull();
          expect(scene.found).toMatchSnapshot();
        });
      });
    });

    given('[case4] get.one meta overload', () => {
      when('[t0] include.meta is requested', () => {
        const key = `acceptance/${getUuid()}/get-meta.txt`;
        const body = `acceptance-${getUuid()}`;

        const scene = useBeforeAll(async () => {
          const written = await sdkAwsS3.set({
            bucket,
            key,
            body,
            include: { meta: true },
          });
          const got = await sdkAwsS3.get.one({
            bucket,
            key,
            include: { meta: true },
          });
          return { written, got };
        });

        then('it returns body plus a round-tripped etag', () => {
          expect(scene.got?.body).toEqual(body);
          expect(scene.got?.meta.etag).toEqual(scene.written.meta.etag);
        });

        then('the get.one meta envelope shape is locked', () => {
          // property matcher keeps the shape snapshot deterministic (body + etag are live values)
          expect(scene.got).toMatchSnapshot({
            body: expect.any(String),
            meta: { etag: expect.any(String) },
          });
        });
      });

      when('[t1] include.meta is requested but the object is absent', () => {
        const key = `acceptance/${getUuid()}/get-meta-absent.txt`;

        const scene = useBeforeAll(async () => ({
          got: await sdkAwsS3.get.one({ bucket, key, include: { meta: true } }),
        }));

        then('it returns null', () => {
          expect(scene.got).toBeNull();
        });

        then('the absent meta result is locked', () => {
          expect(scene.got).toBeNull();
          expect(scene.got).toMatchSnapshot();
        });
      });
    });

    given(
      '[case5] compare-and-delete via condition.etag — negative paths',
      () => {
        when('[t0] the etag is stale', () => {
          const key = `acceptance/${getUuid()}/cad-stale.txt`;

          const scene = useBeforeAll(async () => {
            await sdkAwsS3.set({ bucket, key, body: 'keep-me' });
            const error = await getError(
              sdkAwsS3.del({
                bucket,
                key,
                condition: { etag: '"deadbeefdeadbeefdeadbeefdeadbeef"' },
              }),
            );
            return { error, found: await sdkAwsS3.get.one({ bucket, key }) };
          });

          then('it throws a typed S3PreconditionFailedError', () => {
            expect(scene.error).toBeInstanceOf(S3PreconditionFailedError);
          });

          then('the precondition error message is clear and actionable', () => {
            // swap every random-key occurrence for a stable token so the message snapshot is deterministic
            const message = (scene.error as Error).message
              .split(key)
              .join('<key>');
            expect(message).toContain('s3 precondition failed');
            expect(message).toMatchSnapshot();
          });

          then('the object is left untouched', () => {
            expect(scene.found).toEqual('keep-me');
          });
        });

        when('[t1] the object is absent', () => {
          const key = `acceptance/${getUuid()}/cad-absent.txt`;

          const scene = useBeforeAll(async () => ({
            error: await getError(
              sdkAwsS3.del({
                bucket,
                key,
                condition: { etag: '"deadbeefdeadbeefdeadbeefdeadbeef"' },
              }),
            ),
          }));

          then(
            'a conditional delete of an absent object throws a typed precondition failure',
            () => {
              expect(scene.error).toBeInstanceOf(S3PreconditionFailedError);
            },
          );

          then('the precondition error message is clear and actionable', () => {
            // swap every random-key occurrence for a stable token so the message snapshot is deterministic
            const message = (scene.error as Error).message
              .split(key)
              .join('<key>');
            expect(message).toContain('s3 precondition failed');
            expect(message).toMatchSnapshot();
          });
        });
      },
    );

    given(
      '[case6] the 409 conflict type is a catchable public contract',
      () => {
        // a live 409 race is not reliably reproducible in ci (see condition.concurrency.integration.test.ts
        // for the live path). the TYPE contract, however, is deterministic: prove the exported class is a
        // real, instanceof-catchable MalfunctionError (exit 1) so a consumer's retry handler can rely on it.
        when('[t0] the exported conflict error is constructed', () => {
          const error = new S3ConditionalConflictError({
            ref: { bucket, key: 'k' },
            condition: { etag: '"e"' },
          });

          then('it is instanceof its own class and MalfunctionError', () => {
            expect(error).toBeInstanceOf(S3ConditionalConflictError);
            expect(error).toBeInstanceOf(MalfunctionError);
          });

          then('it carries retry-may-help exit semantics (exit 1)', () => {
            expect(error.code?.exit).toEqual(1);
          });

          then('its message is clear and actionable, and locked', () => {
            // swap the dynamic bucket for a stable token so the message snapshot is deterministic
            const message = error.message.split(bucket).join('<bucket>');
            expect(message).toContain('s3 conditional request conflict');
            expect(message).toMatchSnapshot();
          });
        });
      },
    );

    given('[case7] get.one meta overload via { uri }', () => {
      when('[t0] include.meta is requested and the object exists', () => {
        const key = `acceptance/${getUuid()}/uri-get-meta.txt`;
        const uri = `s3://${bucket}/${key}`;
        const body = `acceptance-${getUuid()}`;

        const scene = useBeforeAll(async () => {
          const written = await sdkAwsS3.set({
            uri,
            body,
            include: { meta: true },
          });
          const got = await sdkAwsS3.get.one({ uri, include: { meta: true } });
          return { written, got };
        });

        then('it returns body plus a round-tripped etag', () => {
          expect(scene.got?.body).toEqual(body);
          expect(scene.got?.meta.etag).toEqual(scene.written.meta.etag);
        });

        then('the get.one-via-uri meta envelope shape is locked', () => {
          // property matcher keeps the shape snapshot deterministic (body + etag are live values)
          expect(scene.got).toMatchSnapshot({
            body: expect.any(String),
            meta: { etag: expect.any(String) },
          });
        });
      });

      when('[t1] include.meta is requested but the object is absent', () => {
        const key = `acceptance/${getUuid()}/uri-get-meta-absent.txt`;
        const uri = `s3://${bucket}/${key}`;

        const scene = useBeforeAll(async () => ({
          got: await sdkAwsS3.get.one({ uri, include: { meta: true } }),
        }));

        then('it returns null', () => {
          expect(scene.got).toBeNull();
        });

        then('the absent meta result is locked', () => {
          expect(scene.got).toBeNull();
          expect(scene.got).toMatchSnapshot();
        });
      });
    });

    given('[case8] unconditional set with include.meta (no condition)', () => {
      when('[t0] set without a condition but with include.meta', () => {
        const key = `acceptance/${getUuid()}/set-meta.txt`;

        const scene = useBeforeAll(async () => {
          const written = await sdkAwsS3.set({
            bucket,
            key,
            body: 'unconditional-meta',
            include: { meta: true },
          });
          return { written };
        });

        then('the write returns a meta etag', () => {
          expect(scene.written.meta.etag).toEqual(expect.any(String));
        });

        then('the unconditional meta envelope shape is locked', () => {
          // property matcher keeps the shape snapshot deterministic (etag is a live s3 value)
          expect(scene.written).toMatchSnapshot({
            meta: { etag: expect.any(String) },
          });
        });
      });
    });

    given('[case9] compare-and-set on an absent key', () => {
      when('[t0] the target key was never created', () => {
        const key = `acceptance/${getUuid()}/cas-absent.txt`;

        const scene = useBeforeAll(async () => ({
          error: await getError(
            sdkAwsS3.set({
              bucket,
              key,
              body: 'v1',
              condition: { etag: '"deadbeefdeadbeefdeadbeefdeadbeef"' },
            }),
          ),
          found: await sdkAwsS3.get.one({ bucket, key }),
        }));

        then('it throws a typed S3PreconditionFailedError', () => {
          expect(scene.error).toBeInstanceOf(S3PreconditionFailedError);
        });

        then('no object was created', () => {
          expect(scene.found).toBeNull();
        });

        then('the precondition error message is clear and actionable', () => {
          // swap every random-key occurrence for a stable token so the message snapshot is deterministic
          const message = (scene.error as Error).message
            .split(key)
            .join('<key>');
          expect(message).toContain('s3 precondition failed');
          expect(message).toMatchSnapshot();
        });
      });
    });

    given('[case10] conditional writes via { uri }', () => {
      when('[t0] put-if-absent on an absent object succeeds', () => {
        const key = `acceptance/${getUuid()}/uri-put-if-absent.txt`;
        const uri = `s3://${bucket}/${key}`;

        const scene = useBeforeAll(async () => {
          const written = await sdkAwsS3.set({
            uri,
            body: 'locked',
            condition: { etag: null },
            include: { meta: true },
          });
          return { written };
        });

        then('the write succeeds and returns a meta etag', () => {
          expect(scene.written.meta.etag).toEqual(expect.any(String));
        });

        then('the put-if-absent-via-uri meta envelope shape is locked', () => {
          // property matcher keeps the shape snapshot deterministic (etag is a live s3 value)
          expect(scene.written).toMatchSnapshot({
            meta: { etag: expect.any(String) },
          });
        });
      });

      when('[t1] put-if-absent on an extant object is blocked', () => {
        const key = `acceptance/${getUuid()}/uri-put-if-absent-exists.txt`;
        const uri = `s3://${bucket}/${key}`;

        const scene = useBeforeAll(async () => {
          await sdkAwsS3.set({ uri, body: 'first' });
          const error = await getError(
            sdkAwsS3.set({ uri, body: 'second', condition: { etag: null } }),
          );
          return { error };
        });

        then('it throws a typed S3PreconditionFailedError', () => {
          expect(scene.error).toBeInstanceOf(S3PreconditionFailedError);
        });

        then('the precondition error message is clear and actionable', () => {
          // swap every random-key occurrence for a stable token so the message snapshot is deterministic
          const message = (scene.error as Error).message
            .split(key)
            .join('<key>');
          expect(message).toContain('s3 precondition failed');
          expect(message).toMatchSnapshot();
        });
      });
    });
  });
});
