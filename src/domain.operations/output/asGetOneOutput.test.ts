import { given, then, when } from 'test-fns';

import { asGetOneOutput } from './asGetOneOutput';

describe('asGetOneOutput', () => {
  given('[case1] an absent object', () => {
    when('[t0] shaped without meta', () => {
      then('it yields null', () => {
        expect(asGetOneOutput({ object: null, includeMeta: false })).toEqual(
          null,
        );
      });
    });

    when('[t1] shaped with meta', () => {
      then('it yields null', () => {
        expect(asGetOneOutput({ object: null, includeMeta: true })).toEqual(
          null,
        );
      });
    });
  });

  given('[case2] a present object with a body and etag', () => {
    const object = { body: 'hello', etag: '"abc123"' };

    when('[t0] shaped without meta', () => {
      then('it yields the body string verbatim', () => {
        expect(asGetOneOutput({ object, includeMeta: false })).toEqual('hello');
      });
    });

    when('[t1] shaped with meta', () => {
      then('it yields the body plus the quoted etag verbatim', () => {
        expect(asGetOneOutput({ object, includeMeta: true })).toEqual({
          body: 'hello',
          meta: { etag: '"abc123"' },
        });
      });
    });
  });

  given('[case3] a present object with a null body', () => {
    const object = { body: null, etag: '"abc123"' };

    when('[t0] shaped with meta', () => {
      then('it yields null (absent body has no meta shape)', () => {
        expect(asGetOneOutput({ object, includeMeta: true })).toEqual(null);
      });
    });
  });

  given('[case4] a present body but a null etag', () => {
    const object = { body: 'hello', etag: null };

    when('[t0] shaped with meta', () => {
      then('it throws, since meta can not be surfaced without an etag', () => {
        expect(() => asGetOneOutput({ object, includeMeta: true })).toThrow(
          'can not surface meta',
        );
      });
    });
  });
});
