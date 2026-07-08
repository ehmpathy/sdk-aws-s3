/**
 * .what = transformer that classifies a caught s3 error from a conditional write into a
 *         typed domain error, or null when the error is not a condition error
 * .why = conditional writes surface distinct codes that mean different things:
 *        - 412 PreconditionFailed → decided outcome, caller must fix (do not retry blindly)
 *        - 404 NoSuchKey → a conditional del of an absent object (verified empirically): the
 *          expected object/etag is not present, so the precondition is unmet → treat as a
 *          precondition failure so consumers catch one typed error for "my fenced write did
 *          not happen"
 *        - 409 ConditionalRequestConflict → concurrent collision, re-read etag + retry
 *        every other error yields null, so the caller rethrows it untouched.
 *
 * .note = pure classifier (returns the typed error or null); the caller decides whether to
 *         throw. this keeps the classify concern separable from the throw side-effect, so a
 *         consumer can inspect a classified error without a throw.
 */
import { S3ServiceException } from '@aws-sdk/client-s3';

import { S3ConditionalConflictError } from '../../domain.objects/S3ConditionalConflictError';
import { S3PreconditionFailedError } from '../../domain.objects/S3PreconditionFailedError';
import type { S3RefByObject } from '../../domain.objects/S3Ref';

export const asS3ConditionError = (input: {
  error: unknown;
  ref: S3RefByObject;
  condition: { etag: string | null };
}): S3PreconditionFailedError | S3ConditionalConflictError | null => {
  const { error, ref, condition } = input;

  // only typed s3 service exceptions map; all else yields null (caller rethrows)
  if (!(error instanceof S3ServiceException)) return null;

  const status = error.$metadata?.httpStatusCode;

  // 412 precondition failed → typed caller-must-fix error
  if (status === 412 || error.name === 'PreconditionFailed')
    return new S3PreconditionFailedError({ ref, condition, cause: error });

  // 404 no such key on a conditional op → the expected object/etag is absent,
  // so the precondition is unmet (verified: conditional del of an absent key)
  if (status === 404 || error.name === 'NoSuchKey')
    return new S3PreconditionFailedError({ ref, condition, cause: error });

  // 409 concurrent conflict → typed retry signal
  if (status === 409 || error.name === 'ConditionalRequestConflict')
    return new S3ConditionalConflictError({ ref, condition, cause: error });

  // not a condition error → null (caller rethrows the original)
  return null;
};
