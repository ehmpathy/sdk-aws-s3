/**
 * .what = context type for sdk-aws-s3 operations
 * .why = enables dependency injection of S3Client
 */
import type { S3Client } from '@aws-sdk/client-s3';

export interface ContextSdkAwsS3 {
  aws?: {
    s3?: {
      client?: S3Client;
    };
  };
}
