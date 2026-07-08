# self-review: behavior-declaration-coverage

## method
one pass over issue #5 and the vision-yield, then a second pass over the code to confirm each named
promise has a home in both `src/` and a test. i treated any un-tested promise as an open gap.

## the promises, and where each lands

1. atomic put-if-absent → `condition.etag: null` → `If-None-Match: *` (acceptance case1).
2. optimistic compare-and-set → `condition.etag: <val>` → `If-Match` (acceptance case2).
3. fenced compare-and-delete → same `If-Match` on delete (acceptance case3 + case5 negatives).
4. etag returned from set → `include.meta` → `{ meta: { etag } }` (acceptance case1 t0 snapshot).
5. etag returned from get.one → overload → `{ body, meta } | null` (acceptance case4 t0 + t1).
6. 412 as a typed caller-fault → `S3PreconditionFailedError` (case1/2/5 + unit mapper).
7. 409 as a typed infra-retry → `S3ConditionalConflictError` (unit mapper; 409 is not
   deterministically forced against live s3).

## deltas closed in this review
- get.one meta on an absent key was not acceptance-proven → case4 t1 (null) + snapshot added.
- the precondition failure text was only type-checked → deterministic message snapshots added.

## verdict
full coverage. each vision promise resolves to a concrete code path and at least one test.
