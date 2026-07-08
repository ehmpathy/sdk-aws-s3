/**
 * .what = sdk-aws-s3 contract export
 * .why = provides ergonomic S3 operations via single sdk object
 */
import { del } from '../domain.operations/del';
import { getAll } from '../domain.operations/getAll';
import { getOne } from '../domain.operations/getOne';
import { set } from '../domain.operations/set';

export type { ContextSdkAwsS3 } from '../domain.objects/ContextSdkAwsS3';
export { S3ConditionalConflictError } from '../domain.objects/S3ConditionalConflictError';
export { S3PreconditionFailedError } from '../domain.objects/S3PreconditionFailedError';
export type { S3Ref } from '../domain.objects/S3Ref';

export const sdkAwsS3 = {
  get: {
    one: getOne,
    all: getAll,
  },
  set,
  del,
};
