import { ConstraintError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { asS3Ref } from './asS3Ref';

describe('asS3Ref', () => {
  given('[case1] valid s3 uri', () => {
    when('[t0] parsed', () => {
      then('extracts bucket and key', () => {
        const result = asS3Ref({ uri: 's3://my-bucket/path/to/object' });
        expect(result).toEqual({ bucket: 'my-bucket', key: 'path/to/object' });
      });
    });
  });

  given('[case2] bucket and key input', () => {
    when('[t0] passed through', () => {
      then('returns same bucket and key', () => {
        const result = asS3Ref({ bucket: 'my-bucket', key: 'path/to/object' });
        expect(result).toEqual({ bucket: 'my-bucket', key: 'path/to/object' });
      });
    });
  });

  given('[case3] invalid scheme', () => {
    when('[t0] parsed', () => {
      then('throws a typed ConstraintError with the scheme message', () => {
        expect(() => asS3Ref({ uri: 'http://my-bucket/path' })).toThrow(
          ConstraintError,
        );
        expect(() => asS3Ref({ uri: 'http://my-bucket/path' })).toThrow(
          'invalid s3 uri scheme',
        );
      });
    });
  });

  given('[case4] malformed uri with no key', () => {
    when('[t0] parsed', () => {
      then('throws error', () => {
        expect(() => asS3Ref({ uri: 's3://my-bucket' })).toThrow(
          'malformed s3 uri: no key found',
        );
      });
    });
  });

  given('[case5] malformed uri with no bucket', () => {
    when('[t0] parsed', () => {
      then('throws error', () => {
        expect(() => asS3Ref({ uri: 's3:///path/to/object' })).toThrow(
          'malformed s3 uri: no bucket found',
        );
      });
    });
  });

  given('[case6] uri with empty key', () => {
    when('[t0] parsed', () => {
      then('returns empty key', () => {
        const result = asS3Ref({ uri: 's3://my-bucket/' });
        expect(result).toEqual({ bucket: 'my-bucket', key: '' });
      });
    });
  });

  given('[case7] uri with suffix slash', () => {
    when('[t0] parsed', () => {
      then('preserves suffix slash in key', () => {
        const result = asS3Ref({ uri: 's3://my-bucket/path/to/prefix/' });
        expect(result).toEqual({ bucket: 'my-bucket', key: 'path/to/prefix/' });
      });
    });
  });
});
