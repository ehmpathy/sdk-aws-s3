/**
 * .what = error thrown when a conditional write precondition is not met (http 412)
 * .why = gives consumers a typed, caller-must-fix signal for compare-and-set /
 *        put-if-absent contention, instead of a check on raw s3 error strings
 *
 * extends ConstraintError (caller-must-fix, exit 2). the real s3 status is 412
 * PreconditionFailed — conveyed by the class name + message; the inherited exit code
 * (2) keeps the caller-must-fix convention. the original s3 error is preserved as
 * `cause` so the full context survives for diagnosis (failloud).
 *
 * @public — exported on the public sdk barrel; consumers `instanceof`-catch it, so a
 * rename would break their error handlers (a semver-major change).
 */
import { ConstraintError } from 'helpful-errors';

import type { S3RefByObject } from './S3Ref';

export class S3PreconditionFailedError extends ConstraintError {
  constructor(input: {
    ref: S3RefByObject;
    condition: { etag: string | null };
    cause?: Error;
  }) {
    super(
      [
        `s3 precondition failed: object at ${input.ref.bucket}/${input.ref.key} did not satisfy condition.etag=${input.condition.etag === null ? 'null (expected absent)' : input.condition.etag}.`,
        input.condition.etag === null
          ? 'to fix: the object is already present — delete it first, or omit condition to overwrite unconditionally.'
          : 'to fix: re-read the object via get.one with include.meta to get its latest etag, then retry with condition.etag set to that value.',
      ].join(' '),
      input,
    );
  }
}
