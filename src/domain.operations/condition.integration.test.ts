import { getError } from 'helpful-errors';
import { given, then, useBeforeAll, when } from 'test-fns';
import { getUuid } from 'uuid-fns';

import { getTestBucket } from '../__test_assets__/getTestBucket';
import { S3ConditionalConflictError } from '../domain.objects/S3ConditionalConflictError';
import { S3PreconditionFailedError } from '../domain.objects/S3PreconditionFailedError';
import { del } from './del';
import { getOne } from './getOne';
import { set } from './set';

describe('conditional writes', () => {
  const bucket = getTestBucket();

  given('[case1] put-if-absent via condition.etag=null', () => {
    when('[t0] the object is absent', () => {
      const key = `test/${getUuid()}/put-if-absent-new.txt`;
      const body = `body-${getUuid()}`;

      const scene = useBeforeAll(async () => {
        const written = await set({
          bucket,
          key,
          body,
          condition: { etag: null },
          include: { meta: true },
        });
        const found = await getOne({ bucket, key });
        return { written, found };
      });

      then('the object was created with our body', () => {
        expect(scene.found).toEqual(body);
      });

      then('meta carries a non-empty etag', () => {
        expect(scene.written.meta.etag).toEqual(expect.any(String));
        expect(scene.written.meta.etag.length).toBeGreaterThan(0);
      });
    });

    when('[t1] the object already exists', () => {
      const key = `test/${getUuid()}/put-if-absent-exists.txt`;

      const scene = useBeforeAll(async () => {
        // seed the object
        await set({ bucket, key, body: 'first' });
        // attempt to create-if-absent again
        const error = await getError(
          set({ bucket, key, body: 'second', condition: { etag: null } }),
        );
        const found = await getOne({ bucket, key });
        return { error, found };
      });

      then(
        'the second put-if-absent throws a typed precondition failure',
        () => {
          expect(scene.error).toBeInstanceOf(S3PreconditionFailedError);
        },
      );

      then('the original body is untouched', () => {
        expect(scene.found).toEqual('first');
      });
    });
  });

  given('[case2] compare-and-set via condition.etag=<etag>', () => {
    when('[t0] the etag matches the current version', () => {
      const key = `test/${getUuid()}/cas-match.txt`;

      const scene = useBeforeAll(async () => {
        const created = await set({
          bucket,
          key,
          body: 'v1',
          include: { meta: true },
        });
        await set({
          bucket,
          key,
          body: 'v2',
          condition: { etag: created.meta.etag },
        });
        return { found: await getOne({ bucket, key }) };
      });

      then('the object holds the new body', () => {
        expect(scene.found).toEqual('v2');
      });
    });

    when('[t1] the etag does not match', () => {
      const key = `test/${getUuid()}/cas-stale.txt`;

      const scene = useBeforeAll(async () => {
        await set({ bucket, key, body: 'v1' });
        const error = await getError(
          set({
            bucket,
            key,
            body: 'v2',
            condition: { etag: '"deadbeefdeadbeefdeadbeefdeadbeef"' },
          }),
        );
        return { error, found: await getOne({ bucket, key }) };
      });

      then('the overwrite throws a typed precondition failure', () => {
        expect(scene.error).toBeInstanceOf(S3PreconditionFailedError);
      });

      then('the object still holds the original body', () => {
        expect(scene.found).toEqual('v1');
      });
    });
  });

  given('[case3] compare-and-delete via condition.etag=<etag>', () => {
    when('[t0] the etag matches the current version', () => {
      const key = `test/${getUuid()}/cad-match.txt`;

      const scene = useBeforeAll(async () => {
        const created = await set({
          bucket,
          key,
          body: 'to-delete',
          include: { meta: true },
        });
        await del({ bucket, key, condition: { etag: created.meta.etag } });
        return { found: await getOne({ bucket, key }) };
      });

      then('the object is gone', () => {
        expect(scene.found).toBeNull();
      });
    });

    when('[t1] the etag does not match', () => {
      const key = `test/${getUuid()}/cad-stale.txt`;

      const scene = useBeforeAll(async () => {
        await set({ bucket, key, body: 'keep-me' });
        const error = await getError(
          del({
            bucket,
            key,
            condition: { etag: '"deadbeefdeadbeefdeadbeefdeadbeef"' },
          }),
        );
        return { error, found: await getOne({ bucket, key }) };
      });

      then('the delete throws a typed precondition failure', () => {
        expect(scene.error).toBeInstanceOf(S3PreconditionFailedError);
      });

      then('the object still exists', () => {
        expect(scene.found).toEqual('keep-me');
      });
    });
  });

  given('[case4] get.one meta overload', () => {
    when('[t0] include.meta is requested for an extant object', () => {
      const key = `test/${getUuid()}/get-meta.txt`;
      const body = `body-${getUuid()}`;

      const scene = useBeforeAll(async () => {
        const created = await set({
          bucket,
          key,
          body,
          include: { meta: true },
        });
        const got = await getOne({ bucket, key, include: { meta: true } });
        return { created, got };
      });

      then('body matches', () => {
        expect(scene.got?.body).toEqual(body);
      });

      then('the get etag round-trips the set etag verbatim', () => {
        expect(scene.got?.meta.etag).toEqual(scene.created.meta.etag);
      });
    });

    when('[t1] include.meta is requested for an absent object', () => {
      const key = `test/${getUuid()}/get-meta-absent.txt`;

      const scene = useBeforeAll(async () => ({
        got: await getOne({ bucket, key, include: { meta: true } }),
      }));

      then('the result is null', () => {
        expect(scene.got).toBeNull();
      });
    });
  });

  given(
    '[case5] del + condition.etag on an ABSENT object (empirical probe)',
    () => {
      // .note = the vision flagged this as unverified. empirically pinned here: s3 returns
      //         404 NoSuchKey (not 412) for a conditional If-Match delete of an absent key.
      //         the contract maps that to S3PreconditionFailedError, since the expected
      //         object/etag is absent → the precondition is unmet.
      when('[t0] a conditional delete targets a never-created key', () => {
        const key = `test/${getUuid()}/cad-absent.txt`;

        const scene = useBeforeAll(async () => ({
          error: await getError(
            del({
              bucket,
              key,
              condition: { etag: '"deadbeefdeadbeefdeadbeefdeadbeef"' },
            }),
          ),
        }));

        then(
          'the absent-on-If-Match delete maps to a typed precondition failure',
          () => {
            expect(scene.error).toBeInstanceOf(S3PreconditionFailedError);
          },
        );
      });
    },
  );

  given(
    '[case6] compare-and-set via condition.etag on an ABSENT object',
    () => {
      // distinct from put-if-absent (etag=null) and from stale-etag-on-present: here a
      // compare-and-set names a concrete etag for a key that does not yet exist → 412.
      when('[t0] the target key was never created', () => {
        const key = `test/${getUuid()}/cas-absent.txt`;

        const scene = useBeforeAll(async () => ({
          error: await getError(
            set({
              bucket,
              key,
              body: 'v1',
              condition: { etag: '"deadbeefdeadbeefdeadbeefdeadbeef"' },
            }),
          ),
          found: await getOne({ bucket, key }),
        }));

        then('the compare-and-set throws a typed precondition failure', () => {
          expect(scene.error).toBeInstanceOf(S3PreconditionFailedError);
        });

        then('no object was created', () => {
          expect(scene.found).toBeNull();
        });
      });
    },
  );

  given('[case7] typed errors are distinct', () => {
    when('[t0] a precondition failure is thrown', () => {
      const key = `test/${getUuid()}/distinct.txt`;

      const scene = useBeforeAll(async () => {
        await set({ bucket, key, body: 'x' });
        return {
          error: await getError(
            set({ bucket, key, body: 'y', condition: { etag: null } }),
          ),
        };
      });

      then('it is a precondition error, not a conflict error', () => {
        expect(scene.error).toBeInstanceOf(S3PreconditionFailedError);
        expect(scene.error).not.toBeInstanceOf(S3ConditionalConflictError);
      });
    });
  });
});
