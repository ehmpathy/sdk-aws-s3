# self-review: behavior-declaration-coverage

## how i checked
i took issue #5 and `1.vision.yield.md`, listed every promised capability, then hunted for the
exact code path + test that proves each one. any promise without both is a gap.

## capability-by-capability

- **put-if-absent** — `condition: { etag: null }` flows through `asS3ConditionHeaders` to
  `If-None-Match: *`. proven by acceptance case1 (t0 writes when absent, t1 rejects when present).
- **compare-and-set** — `condition: { etag }` becomes `If-Match`. proven by acceptance case2 (t0
  overwrites on match, t1 rejects on stale).
- **compare-and-delete** — same `If-Match` on the delete path. proven by acceptance case3 (happy)
  plus case5 (stale + absent negatives).
- **etag surfaced on set** — `include: { meta: true }` yields `{ meta: { etag } }`. proven by
  acceptance case1 t0 snapshot.
- **etag surfaced on get.one** — overload yields `{ body, meta: { etag } }`, or `null` when absent.
  proven by acceptance case4 t0 (present) and t1 (absent → null).
- **typed 412** — `S3PreconditionFailedError`, checked across case1/2/5 plus the unit mapper test.
- **typed 409** — `S3ConditionalConflictError`, covered by the unit mapper test (409 is not
  deterministically reproducible against real s3 in an acceptance run).

## gaps i found and closed
- the get.one meta **absent → null** branch had no acceptance proof → added case4 t1 + snapshot.
- the conditional-failure **messages** were asserted only by type → added deterministic message
  snapshots so the user-read text is locked.

## verdict
every vision requirement maps to code + a test; no promised capability is absent.
