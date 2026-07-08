# self-review r1 — has-behavior-coverage

## what i reviewed

i walked issue #5 (0.wish.md) and 1.vision.yield.md line by line, then matched each
promised behavior to a concrete test. i opened `src/contract/index.acceptance.test.ts`,
`src/contract/index.journey.acceptance.test.ts`, and the five
`src/domain.operations/*.integration.test.ts` files to confirm the tests truly exercise
each behavior — not just name it.

## behavior → test map (every wish/vision promise)

| promised behavior | proof test | verdict |
|---|---|---|
| put-if-absent succeeds when absent (`If-None-Match: *`, `condition.etag=null`) | acceptance case1 t0 + condition.integration | covered |
| put-if-absent throws typed precondition when present | acceptance case1 t1 | covered |
| compare-and-set overwrites on etag match (`If-Match`) | acceptance case2 t0 | covered |
| compare-and-set throws typed precondition on stale etag; object unchanged | acceptance case2 t1 | covered |
| compare-and-delete removes on etag match | acceptance case3 t0 + del.integration | covered |
| compare-and-delete throws typed precondition on stale etag; object untouched | acceptance case5 t0 | covered |
| compare-and-delete of absent object throws typed precondition (404→typed) | acceptance case5 t1 | covered |
| set surfaces etag via opt-in `include.meta` | acceptance case1 t0 + set.integration | covered |
| get.one surfaces etag via opt-in `include.meta`; etag round-trips verbatim | acceptance case4 t0 + getOne.integration | covered |
| get.one `include.meta` returns null when absent | acceptance case4 t1 | covered |
| typed errors exported from public sdk | acceptance imports `S3PreconditionFailedError` from `./index` | covered |

## issues found and fixed

not one promised behavior lacked a test — no test had to be written during this pass.

but i did find and fix a coverage-quality defect: two behaviors (get.one body round-trip,
journey get.all listings) were "covered" by snapshots that captured random uuids, so the
snapshot proved a per-run accident, not the behavior. worse, they would fail on every CI
acceptance run (no `--updateSnapshot` in CI). i made the snapshots deterministic
(fixed body literals; bodies-only journey snapshot; full-occurrence key substitution in the
error-message snaps). the behavior assertions (`toEqual`, `toBeInstanceOf`) were already
correct and were left untouched — only the snapshot inputs were stabilized.

## non-issues that hold

- **409 `S3ConditionalConflictError` has no live acceptance test.** this holds: the vision
  (build-decision 2 in 5.1 yield) deliberately keeps 409 internal-only and notes 409 is not
  deterministically triggerable via a live concurrent collision. the mapping 409→typed IS
  covered at the unit grain by `throwMappedS3ConditionError.test.ts`. so the mapping behavior
  is proven; only a live race is absent, by design.
- **compare-and-set/compare-and-delete positive paths use state assertions, not snapshots.**
  this holds: success is "the object now holds v2" / "the object is gone" — verified by a
  follow-up `get.one` `toEqual`/`toBeNull`. a snapshot would add no value over the exact
  equality assertion.
