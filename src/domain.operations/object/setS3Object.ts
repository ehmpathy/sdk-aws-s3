/**
 * .what = communicator that sends a (conditional) put to s3 and maps condition errors
 * .why = isolates the raw i/o + error-map so the set orchestrator reads as narrative,
 *        instead of an inline try/catch that a reader must simulate
 */
import { PutObjectCommand } from '@aws-sdk/client-s3';

import type { ContextSdkAwsS3 } from '../../domain.objects/ContextSdkAwsS3';
import type { S3RefByObject } from '../../domain.objects/S3Ref';
import { asS3ConditionError } from '../condition/asS3ConditionError';
import { asS3ConditionHeaders } from '../condition/asS3ConditionHeaders';
import { getS3Client } from '../getS3Client';

export const setS3Object = async (
  input: {
    ref: S3RefByObject;
    body: string;
    condition: { etag: string | null } | null;
  },
  context?: ContextSdkAwsS3,
  // narrowed to the minimum shape the set orchestrator needs (just the etag), so the
  // orchestrator layer takes no dependency on the raw aws PutObjectCommandOutput type
): Promise<{ ETag?: string }> => {
  // get or create client
  const client = getS3Client({ context });

  // map the optional write-condition to s3 precondition headers
  const conditionHeaders = input.condition
    ? asS3ConditionHeaders({ condition: input.condition })
    : {};

  // send the put; map condition errors to typed domain errors when a condition was in play
  try {
    const response = await client.send(
      new PutObjectCommand({
        Bucket: input.ref.bucket,
        Key: input.ref.key,
        Body: input.body,
        ...conditionHeaders,
      }),
    );
    return { ETag: response.ETag };
  } catch (error) {
    // classify a condition breach into a typed error; rethrow the original otherwise
    if (input.condition)
      throw (
        asS3ConditionError({
          error,
          ref: input.ref,
          condition: input.condition,
        }) ?? error
      );
    throw error;
  }
};
