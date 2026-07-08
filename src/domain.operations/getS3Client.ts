/**
 * .what = communicator that supplies the S3Client: the injected one, or a zero-config default
 * .why = every s3 communicator needs a client; this centralizes the "injected ?? default"
 *        resolution so client config (region, retry) has exactly one home, and so the
 *        default-client ergonomic is not duplicated across each operation.
 */
import { S3Client } from '@aws-sdk/client-s3';

import type { ContextSdkAwsS3 } from '../domain.objects/ContextSdkAwsS3';

export const getS3Client = (input: { context?: ContextSdkAwsS3 }): S3Client =>
  input.context?.aws?.s3?.client ?? new S3Client({});
