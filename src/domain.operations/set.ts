/**
 * .what = orchestrator that upserts an object to S3
 * .why = provides ergonomic set operation (create or overwrite)
 */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import type { ContextSdkAwsS3 } from '../domain.objects/ContextSdkAwsS3';
import type { S3Ref } from '../domain.objects/S3Ref';
import { asS3Ref } from './asS3Ref';

export const set = async (
  input: S3Ref<'object'> & { body: string },
  context?: ContextSdkAwsS3,
): Promise<void> => {
  // parse input to bucket + key
  const ref = asS3Ref(input);

  // get or create client
  const client = context?.aws?.s3?.client ?? new S3Client({});

  // upsert object
  await client.send(
    new PutObjectCommand({
      Bucket: ref.bucket,
      Key: ref.key,
      Body: input.body,
    }),
  );
};
