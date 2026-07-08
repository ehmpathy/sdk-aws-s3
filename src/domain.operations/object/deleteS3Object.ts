/**
 * .what = communicator that sends a (conditional) delete to s3 and maps condition errors
 * .why = isolates the raw i/o + error-map so the del orchestrator reads as narrative,
 *        instead of an inline try/catch that a reader must simulate
 */
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

import type { ContextSdkAwsS3 } from '../../domain.objects/ContextSdkAwsS3';
import type { S3RefByObject } from '../../domain.objects/S3Ref';
import { asS3ConditionError } from '../condition/asS3ConditionError';
import { asS3ConditionHeaders } from '../condition/asS3ConditionHeaders';
import { getS3Client } from '../getS3Client';

export const deleteS3Object = async (
  input: {
    ref: S3RefByObject;
    condition: { etag: string } | null;
  },
  context?: ContextSdkAwsS3,
): Promise<void> => {
  // get or create client
  const client = getS3Client({ context });

  // map the optional compare-and-delete condition to s3 precondition headers
  const conditionHeaders = input.condition
    ? asS3ConditionHeaders({ condition: input.condition })
    : {};

  // send the delete; map condition errors to typed domain errors when a condition was in play
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: input.ref.bucket,
        Key: input.ref.key,
        ...conditionHeaders,
      }),
    );
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
