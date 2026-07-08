/**
 * .what = transformer that shapes a raw s3 put response into the set output
 * .why = keeps the set orchestrator a narrative; the include.meta branch and
 *        etag extraction live here as one named, pure decode step
 */
import { MalfunctionError } from 'helpful-errors';

export const asSetOutput = (input: {
  response: { ETag?: string };
  includeMeta: boolean;
}): void | { meta: { etag: string } } => {
  // default (no-meta) shape → void
  if (!input.includeMeta) return;

  // surface the written object's etag, verbatim (quotes preserved)
  const etag =
    input.response.ETag ??
    MalfunctionError.throw('s3 put returned no etag; can not surface meta', {
      response: input.response,
    });
  return { meta: { etag } };
};
