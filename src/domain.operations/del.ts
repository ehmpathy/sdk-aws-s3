/**
 * .what = orchestrator that deletes an object from S3
 * .why = provides idempotent delete, plus atomic compare-and-delete via `condition`
 *        (delete only our version). s3 has no delete-if-absent, so condition.etag is a string.
 *
 * .note = `condition?` is optional as a public sdk entry point (re-exported on `sdkAwsS3`);
 *         per rule.prefer.optional-input-for-sdk-ux this overrides forbid.undefined-inputs
 *         so `del({ bucket, key })` stays zero-friction for the common unconditional case.
 */
import type { ContextSdkAwsS3 } from '../domain.objects/ContextSdkAwsS3';
import type { S3Ref } from '../domain.objects/S3Ref';
import { deleteS3Object } from './object/deleteS3Object';
import { asS3Ref } from './ref/asS3Ref';

export const del = async (
  input: S3Ref<'object'> & {
    condition?: { etag: string };
  },
  context?: ContextSdkAwsS3,
): Promise<void> => {
  // parse input to bucket + key
  const ref = asS3Ref(input);

  // delete object (idempotent when unconditional; conditional when condition supplied)
  await deleteS3Object({ ref, condition: input.condition ?? null }, context);
};
