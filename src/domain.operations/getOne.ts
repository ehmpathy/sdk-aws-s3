/**
 * .what = orchestrator that fetches a single object from S3
 * .why = provides ergonomic get operation with undefined for 404
 */
import {
  GetObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';

import type { ContextSdkAwsS3 } from '../domain.objects/ContextSdkAwsS3';
import type { S3Ref } from '../domain.objects/S3Ref';
import { asS3Ref } from './asS3Ref';

export const getOne = async (
  input: S3Ref<'object'>,
  context?: ContextSdkAwsS3,
): Promise<string | null> => {
  // parse input to bucket + key
  const ref = asS3Ref(input);

  // get or create client
  const client = context?.aws?.s3?.client ?? new S3Client({});

  // fetch object
  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: ref.bucket,
        Key: ref.key,
      }),
    );

    // read body as string
    const body = await response.Body?.transformToString();
    return body ?? null;
  } catch (error) {
    // handle 404 via dual check (name + httpStatusCode)
    if (error instanceof S3ServiceException) {
      if (
        error.name === 'NoSuchKey' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return null;
      }
    }

    // propagate all other errors
    throw error;
  }
};
