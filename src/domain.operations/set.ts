/**
 * .what = orchestrator that upserts an object to S3, with optional conditional-write
 * .why = provides ergonomic set (create or overwrite), plus atomic put-if-absent /
 *        compare-and-set via `condition`, and opt-in `meta` (etag) via `include`
 *
 * .note = `set` mirrors the s3 sdk's public get/set/del verb triad and is idempotent
 *         (PutObject overwrites), so the safety intent of forbid.nonidempotent-mutations
 *         holds. it is also the already-published public name (v0.1.x); a rename would be
 *         a semver-major break of consumers, out of scope for this conditional-write wish.
 * .note = the `function` overloads narrow the return by input shape (void vs meta); the
 *         arrow form can not do so without a forbid.as-cast (see getOne for the full note).
 * .note = `condition?` / `include?` are optional as a public sdk entry point (re-exported
 *         on `sdkAwsS3`); per rule.prefer.optional-input-for-sdk-ux this overrides
 *         forbid.undefined-inputs so `set({ bucket, key, body })` needs no null filler.
 */
import type { ContextSdkAwsS3 } from '../domain.objects/ContextSdkAwsS3';
import type { S3Ref } from '../domain.objects/S3Ref';
import { setS3Object } from './object/setS3Object';
import { asSetOutput } from './output/asSetOutput';
import { asS3Ref } from './ref/asS3Ref';

// default — returns void (backwards-compat)
export function set(
  input: S3Ref<'object'> & {
    body: string;
    condition?: { etag: string | null };
  },
  context?: ContextSdkAwsS3,
): Promise<void>;
// opt-in — returns the written object's etag
export function set(
  input: S3Ref<'object'> & {
    body: string;
    condition?: { etag: string | null };
    include: { meta: true };
  },
  context?: ContextSdkAwsS3,
): Promise<{ meta: { etag: string } }>;
export async function set(
  input: S3Ref<'object'> & {
    body: string;
    condition?: { etag: string | null };
    include?: { meta: true };
  },
  context?: ContextSdkAwsS3,
): Promise<void | { meta: { etag: string } }> {
  // parse input to bucket + key
  const ref = asS3Ref(input);

  // upsert object (conditionally, if a condition was supplied)
  const response = await setS3Object(
    { ref, body: input.body, condition: input.condition ?? null },
    context,
  );

  // shape the raw response into the requested output
  return asSetOutput({ response, includeMeta: !!input.include?.meta });
}
