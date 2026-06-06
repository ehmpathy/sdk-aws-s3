/**
 * .what = orchestrator that fetches all objects with a prefix from S3
 * .why = provides ergonomic list + fetch operation with pagination
 */
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

import type { ContextSdkAwsS3 } from '../domain.objects/ContextSdkAwsS3';
import type { S3Ref } from '../domain.objects/S3Ref';
import { asS3Ref } from './asS3Ref';
import { getOne } from './getOne';

export const getAll = async (
  input: S3Ref<'prefix'>,
  context?: ContextSdkAwsS3,
): Promise<Array<{ key: string; content: string }>> => {
  // parse input to bucket + prefix
  const ref = asS3Ref(
    'prefix' in input ? { bucket: input.bucket, key: input.prefix } : input,
  );

  // get or create client
  const client = context?.aws?.s3?.client ?? new S3Client({});

  // list all keys with pagination
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: ref.bucket,
        Prefix: ref.key,
        ContinuationToken: continuationToken,
      }),
    );

    // collect keys
    for (const object of response.Contents ?? []) {
      if (object.Key) keys.push(object.Key);
    }

    // get next page token
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  // fetch content for each key
  const results: Array<{ key: string; content: string }> = [];

  for (const key of keys) {
    const content = await getOne({ bucket: ref.bucket, key }, context);
    if (content !== null) {
      results.push({ key, content });
    }
  }

  return results;
};
