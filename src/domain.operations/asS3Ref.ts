/**
 * .what = transformer that parses S3 URI or bucket+key into ref
 * .why = enables operations to accept either URI or bucket+key input
 */
import type { S3Ref, S3RefByObject } from '../domain.objects/S3Ref';

export const asS3Ref = (input: S3Ref<'object'>): S3RefByObject => {
  // handle bucket+key passthrough
  if ('bucket' in input && 'key' in input) {
    return { bucket: input.bucket, key: input.key };
  }

  // parse URI
  const { uri } = input;

  // validate scheme
  if (!uri.startsWith('s3://')) {
    throw new Error(`invalid s3 uri scheme: expected s3://, got ${uri}`);
  }

  // extract bucket and key from s3://bucket/path/to/key
  const withoutScheme = uri.slice(5); // remove 's3://'
  const slashIndex = withoutScheme.indexOf('/');

  // validate bucket
  if (slashIndex === -1) {
    throw new Error(`malformed s3 uri: no key found in ${uri}`);
  }
  if (slashIndex === 0) {
    throw new Error(`malformed s3 uri: no bucket found in ${uri}`);
  }

  const bucket = withoutScheme.slice(0, slashIndex);
  const key = withoutScheme.slice(slashIndex + 1);

  return { bucket, key };
};
