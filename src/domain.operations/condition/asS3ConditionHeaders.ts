/**
 * .what = transformer that maps a domain write-condition to s3 precondition headers
 * .why = a single `condition.etag` field asserts the expected current state; s3 expresses
 *        that via two mutually-exclusive headers. this centralizes the map so set/del
 *        stay narrative.
 *
 * map:
 * - etag === null   → IfNoneMatch: '*'   (assert absent → put-if-absent)
 * - etag === string → IfMatch: <etag>    (assert this version → compare-and-set / -delete)
 */
export const asS3ConditionHeaders = (input: {
  condition: { etag: string | null };
}): { IfNoneMatch?: '*'; IfMatch?: string } => {
  // assert-absent → put-if-absent
  if (input.condition.etag === null) return { IfNoneMatch: '*' };

  // assert-etag → compare-and-set / compare-and-delete
  return { IfMatch: input.condition.etag };
};
