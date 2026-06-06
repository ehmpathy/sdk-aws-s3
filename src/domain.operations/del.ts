/**
 * .what = orchestrator that deletes an object from S3
 * .why = provides idempotent delete operation
 */
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

import type { ContextSdkAwsS3 } from '../domain.objects/ContextSdkAwsS3';
import type { S3Ref } from '../domain.objects/S3Ref';
import { asS3Ref } from './asS3Ref';

export const del = async (
  input: S3Ref<'object'>,
  context?: ContextSdkAwsS3,
): Promise<void> => {
  // parse input to bucket + key
  const ref = asS3Ref(input);

  // get or create client
  const client = context?.aws?.s3?.client ?? new S3Client({});

  // delete object (idempotent — does not throw if absent)
  await client.send(
    new DeleteObjectCommand({
      Bucket: ref.bucket,
      Key: ref.key,
    }),
  );
};
