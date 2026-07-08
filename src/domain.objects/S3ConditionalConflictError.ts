/**
 * .what = error thrown when a conditional write hits a concurrent in-flight collision (http 409)
 * .why = s3 returns 409 ConditionalRequestConflict when two conditional writes race mid-flight;
 *        aws guidance is to re-read the object etag and retry. surfaced as a typed, distinct
 *        signal so consumers can retry rather than treat it as a decided precondition failure.
 *
 * extends MalfunctionError (transient / server-side, exit 1) since the correct response is retry,
 * not a caller fix. the original s3 error is preserved as `cause` so the full context survives
 * for diagnosis (failloud).
 *
 * @public — exported on the public sdk barrel; consumers `instanceof`-catch it, so a
 * rename would break their error handlers (a semver-major change).
 */
import { MalfunctionError } from 'helpful-errors';

import type { S3RefByObject } from './S3Ref';

export class S3ConditionalConflictError extends MalfunctionError {
  constructor(input: {
    ref: S3RefByObject;
    condition: { etag: string | null };
    cause?: Error;
  }) {
    super(
      `s3 conditional request conflict: a concurrent write raced the conditional write at ${input.ref.bucket}/${input.ref.key}. to fix: re-read the object etag via get.one with include.meta and retry the conditional write.`,
      input,
    );
  }
}
