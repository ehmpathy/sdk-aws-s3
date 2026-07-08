/**
 * .what = transformer that shapes a raw s3 get result into the getOne output
 * .why = keeps the getOne orchestrator a narrative; the null / include.meta
 *        branches live here as one named, pure decode step
 */
import { MalfunctionError } from 'helpful-errors';

export const asGetOneOutput = (input: {
  object: { body: string | null; etag: string | null } | null;
  includeMeta: boolean;
}): string | null | { body: string; meta: { etag: string } } => {
  // absent object → null
  if (input.object === null) return null;

  // default (no-meta) shape → the body string
  if (!input.includeMeta) return input.object.body;

  // absent body → null even in the meta shape
  if (input.object.body === null) return null;

  // surface the object's etag, verbatim (quotes preserved)
  const etag =
    input.object.etag ??
    MalfunctionError.throw(
      's3 get returned a body but no etag; can not surface meta',
      { object: input.object },
    );
  return { body: input.object.body, meta: { etag } };
};
