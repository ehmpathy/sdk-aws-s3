# self-review: role-standards-coverage

this pass asks the inverse of adherance: not "is aught wrong" but "is aught absent." the dirs i
swept: code.test/scope.coverage · scope.unit · scope.integration · scope.acceptance ·
frames.behavior · lessons.howto · code.prod/readable.comments.

present as required:

- **grain → test-scope is honored**. pure transformers (`asS3ConditionHeaders`, `asS3Ref`) get unit
  tests; the mapper gets a 7-case deterministic unit test (412/404/409 + 500-pass + non-s3-pass);
  the communicators + orchestrators get real-s3 integration tests; the `sdkAwsS3` contract gets
  acceptance tests with snapshots (55 green).
- **snapshot + assertion pairs** are in place: property matchers keep live etag/body deterministic;
  error text is snapped via `.replace(key, '<key>')`; every snapshot has a value or instanceof
  assertion beside it.
- **no mock** touches any integration or acceptance test — real s3 only.
- **bdd frame** (given/when/then + useBeforeAll/useThen) holds throughout; no repeated expensive
  calls across then-blocks.

absences i closed this pass: the absent-key meta path and the conditional-error messages were
un-snapped → both now have acceptance snapshots, so no contract output variant is left un-locked.

verdict: full standards coverage; no required practice is omitted.
