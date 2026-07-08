/**
 * .what = sdk-aws-s3 entry point
 * .why = exposes aws s3 operations
 */

export type { ContextSdkAwsS3, S3Ref } from './contract';
export {
  S3ConditionalConflictError,
  S3PreconditionFailedError,
  sdkAwsS3,
} from './contract';
