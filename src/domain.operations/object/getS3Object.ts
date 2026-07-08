/**
 * .what = communicator that fetches an object from s3, with null for a 404 absence
 * .why = isolates the raw i/o (send, body read, 404 map) so the getOne orchestrator
 *        reads as narrative, instead of an inline try/catch that a reader must simulate
 */
import { GetObjectCommand, S3ServiceException } from '@aws-sdk/client-s3';

import type { ContextSdkAwsS3 } from '../../domain.objects/ContextSdkAwsS3';
import type { S3RefByObject } from '../../domain.objects/S3Ref';
import { getS3Client } from '../getS3Client';

export const getS3Object = async (
  input: {
    ref: S3RefByObject;
  },
  context?: ContextSdkAwsS3,
): Promise<{ body: string | null; etag: string | null } | null> => {
  // get or create client
  const client = getS3Client({ context });

  // fetch object; a 404 maps to null (absent)
  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: input.ref.bucket,
        Key: input.ref.key,
      }),
    );

    // read body as string; surface the etag verbatim (quotes preserved)
    const body = (await response.Body?.transformToString()) ?? null;
    return { body, etag: response.ETag ?? null };
  } catch (error) {
    // 404 → null (absent); dual check on name + httpStatusCode
    if (
      error instanceof S3ServiceException &&
      (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404)
    )
      return null;

    // propagate all other errors
    throw error;
  }
};
