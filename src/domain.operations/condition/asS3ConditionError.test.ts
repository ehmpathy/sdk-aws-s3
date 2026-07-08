import { S3ServiceException } from '@aws-sdk/client-s3';
import { given, then, when } from 'test-fns';

import { S3ConditionalConflictError } from '../../domain.objects/S3ConditionalConflictError';
import { S3PreconditionFailedError } from '../../domain.objects/S3PreconditionFailedError';
import { asS3ConditionError } from './asS3ConditionError';

// a fixed ref → deterministic error messages (safe to snapshot; no random uuids)
const ref = { bucket: 'test-bucket', key: 'test/lock.txt' };

// build a typed s3 service exception for a given status + name
const asS3Error = (input: {
  name: string;
  httpStatusCode: number;
}): S3ServiceException =>
  new S3ServiceException({
    name: input.name,
    $fault: 'client',
    $metadata: { httpStatusCode: input.httpStatusCode },
  });

describe('asS3ConditionError', () => {
  given('[case1] a 412 PreconditionFailed error', () => {
    when('[t0] classified with an etag condition', () => {
      const classified = asS3ConditionError({
        error: asS3Error({ name: 'PreconditionFailed', httpStatusCode: 412 }),
        ref,
        condition: { etag: '"abc123"' },
      });

      then('it yields a typed S3PreconditionFailedError', () => {
        expect(classified).toBeInstanceOf(S3PreconditionFailedError);
      });

      then('the message is actionable', () => {
        expect(classified?.message).toMatchSnapshot();
      });
    });
  });

  given('[case2] a 404 NoSuchKey error', () => {
    when(
      '[t0] classified with an etag condition (conditional delete of absent)',
      () => {
        const classified = asS3ConditionError({
          error: asS3Error({ name: 'NoSuchKey', httpStatusCode: 404 }),
          ref,
          condition: { etag: '"abc123"' },
        });

        then('it yields a typed S3PreconditionFailedError', () => {
          expect(classified).toBeInstanceOf(S3PreconditionFailedError);
        });

        then('the message is actionable', () => {
          expect(classified?.message).toMatchSnapshot();
        });
      },
    );
  });

  given('[case3] a 409 ConditionalRequestConflict error', () => {
    when('[t0] classified with a put-if-absent condition', () => {
      const classified = asS3ConditionError({
        error: asS3Error({
          name: 'ConditionalRequestConflict',
          httpStatusCode: 409,
        }),
        ref,
        condition: { etag: null },
      });

      then('it yields a typed S3ConditionalConflictError', () => {
        expect(classified).toBeInstanceOf(S3ConditionalConflictError);
      });

      then('the message tells the caller to re-read and retry', () => {
        expect(classified?.message).toMatchSnapshot();
      });
    });
  });

  given('[case4] a non-condition s3 error (500)', () => {
    when('[t0] classified', () => {
      const classified = asS3ConditionError({
        error: asS3Error({ name: 'InternalError', httpStatusCode: 500 }),
        ref,
        condition: { etag: null },
      });

      then('it yields null (caller rethrows the original)', () => {
        expect(classified).toBeNull();
      });
    });
  });

  given('[case5] a non-s3 error', () => {
    when('[t0] classified', () => {
      const classified = asS3ConditionError({
        error: new Error('network down'),
        ref,
        condition: { etag: null },
      });

      then('it yields null (caller rethrows the original)', () => {
        expect(classified).toBeNull();
      });
    });
  });
});
