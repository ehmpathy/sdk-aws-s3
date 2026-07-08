import { given, then, when } from 'test-fns';

import { asSetOutput } from './asSetOutput';

describe('asSetOutput', () => {
  given('[case1] a put response with an etag', () => {
    const response = { ETag: '"abc123"' };

    when('[t0] shaped without meta', () => {
      then('it yields void', () => {
        expect(asSetOutput({ response, includeMeta: false })).toEqual(
          undefined,
        );
      });
    });

    when('[t1] shaped with meta', () => {
      then('it yields the quoted etag verbatim', () => {
        expect(asSetOutput({ response, includeMeta: true })).toEqual({
          meta: { etag: '"abc123"' },
        });
      });
    });
  });

  given('[case2] a put response absent an etag', () => {
    const response = {};

    when('[t0] shaped with meta', () => {
      then('it throws, since meta can not be surfaced without an etag', () => {
        expect(() => asSetOutput({ response, includeMeta: true })).toThrow(
          'can not surface meta',
        );
      });
    });
  });
});
