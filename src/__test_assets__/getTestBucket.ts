/**
 * .what = gets the test bucket for integration tests
 * .why = enables integration tests against real S3
 */

export const getTestBucket = (): string => {
  return 'ehmpathy-sdk-aws-s3-test-bucket';
};
