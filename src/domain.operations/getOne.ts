/**
 * .what = orchestrator that fetches a single object from S3
 * .why = provides ergonomic get operation with null for 404; opt-in `meta` (etag)
 *        via `include` for read-modify-write / optimistic concurrency
 *
 * .note = the `function` overloads (over arrow form) are deliberate: they narrow the
 *         return type by input shape (body vs body+meta). the arrow + callable-type form
 *         can not narrow the return without an `as`-cast, which rule.forbid.as-cast
 *         prohibits — so the overload idiom is the stricter choice (it avoids the
 *         harder-forbidden cast). the same rationale holds for `set`.
 * .note = `include?` is optional as a public sdk entry point (re-exported on `sdkAwsS3`);
 *         per rule.prefer.optional-input-for-sdk-ux this overrides forbid.undefined-inputs
 *         so callers get zero-friction defaults (`get.one({ bucket, key })`).
 */
import type { ContextSdkAwsS3 } from '../domain.objects/ContextSdkAwsS3';
import type { S3Ref } from '../domain.objects/S3Ref';
import { getS3Object } from './object/getS3Object';
import { asGetOneOutput } from './output/asGetOneOutput';
import { asS3Ref } from './ref/asS3Ref';

// default — returns the body string (backwards-compat)
export function getOne(
  input: S3Ref<'object'>,
  context?: ContextSdkAwsS3,
): Promise<string | null>;
// opt-in — returns body alongside meta (etag)
export function getOne(
  input: S3Ref<'object'> & { include: { meta: true } },
  context?: ContextSdkAwsS3,
): Promise<{ body: string; meta: { etag: string } } | null>;
export async function getOne(
  input: S3Ref<'object'> & { include?: { meta: true } },
  context?: ContextSdkAwsS3,
): Promise<string | null | { body: string; meta: { etag: string } }> {
  // parse input to bucket + key
  const ref = asS3Ref(input);

  // fetch object (null when absent / 404)
  const object = await getS3Object({ ref }, context);

  // shape the raw result into the requested output
  return asGetOneOutput({ object, includeMeta: !!input.include?.meta });
}
