import { given, then, when } from 'test-fns';

import { asS3ConditionHeaders } from './asS3ConditionHeaders';

describe('asS3ConditionHeaders', () => {
  given('[case1] condition.etag is null (assert absent)', () => {
    when('[t0] mapped', () => {
      then('emits IfNoneMatch: * for put-if-absent', () => {
        const result = asS3ConditionHeaders({ condition: { etag: null } });
        expect(result).toEqual({ IfNoneMatch: '*' });
      });
    });
  });

  given('[case2] condition.etag is a string (assert this version)', () => {
    when('[t0] mapped', () => {
      then('emits IfMatch with the etag for compare-and-set', () => {
        const result = asS3ConditionHeaders({
          condition: { etag: '"abc123"' },
        });
        expect(result).toEqual({ IfMatch: '"abc123"' });
      });
    });
  });

  given('[case3] the etag carries s3 double-quotes', () => {
    when('[t0] mapped', () => {
      then('passes the etag through verbatim (quotes preserved)', () => {
        const etag = '"9a0364b9e99bb480dd25e1f0284c8555"';
        const result = asS3ConditionHeaders({ condition: { etag } });
        expect(result).toEqual({ IfMatch: etag });
      });
    });
  });
});
