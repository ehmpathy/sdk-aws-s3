# r1 — has-pruned-yagni

review scope: the code + tests THIS execution pass added on top of the prior-pass product, i.e.
`asS3Ref` typed-error change, `@public` tags, the 3 communicator integration tests, the CAS-on-absent
matrix row, the `getAll` `.content` guard, the live concurrency test, the 409 contract-lock, and the
mutex journey.

## the question
for each addition: was it prescribed (vision / criteria / blueprint / repo rule), or did i add it "while
i was here" / "for future flexibility"?

## findings

### 1. the live concurrency test (`condition.concurrency.integration.test.ts`) — the one real YAGNI risk
this is the addition most exposed to a YAGNI challenge. it fires N=16 concurrent put-if-absent racers.
i questioned it hard:
- is N=16 arbitrary over-engineering? a smaller N (2) would also produce a loser. i kept 16 because a
  2-racer race is far more likely to serialize cleanly (both see 412, never the transient 409); a wider
  fan-out is what actually exercises the s3-ordered 412-vs-409 split the test claims to cover. so N is
  not decoration — it is load-critical for the very contract asserted. **holds, not YAGNI.**
- is the whole test speculative? no — it is the committed resolution to the blueprint's 409-deferral,
  which the behaver `philosophy.verification-strictness` explicitly forbids as a left-open gap. it was
  prescribed by the (human-approved) blueprint, not invented here. **holds.**
  the honest caveat: it is the single addition where a reviewer could reasonably ask the wisher "do you
  want live-race coverage or is the unit+contract-lock enough?" — flagged here as an open question rather
  than silently kept.

### 2. all else traces to a prescription (verified, not YAGNI)
- 3 communicator integration tests → required by `rule.require.test-coverage-by-grain` (communicator
  without an integration test = blocker). their absence was a defect, not their presence a luxury.
- CAS-on-absent `[case7]` → a distinct matrix row the blackbox criteria matrix names (op × condition ×
  object-state); it was a genuine coverage hole, not an extra.
- `getAll` `.content` guard → guards the one deliberate break to the result field name; one assertion,
  no abstraction.
- 409 contract-lock `[case6]` → closes uc6 for the 409 type at the export boundary; deterministic, cheap.
- mutex journey → the wish's CORE user journey; the acceptance-journey rule requires it.
- `asS3Ref` → `BadRequestError` and `@public` tags → error-contract + stability, both raised as review
  concerns; no new surface, just a type swap and two doc tags.

### 3. what i deliberately did NOT add (YAGNI restraint held)
- no configurable racer count / retry knobs on the concurrency test — hard-coded N, no options bag.
- no shared test-helper/util for the repeated `{ ref: { bucket, key } }` shape — three plain call sites
  are cheaper than a premature helper (`rule.prefer.wet-over-dry`).
- no new domain object for "fence token" — it is just the etag string; a wrapper type would be
  speculative ceremony.
- no `del` meta overload for false symmetry (explicitly reasoned out in the blueprint).

## verdict
one item (the live concurrency test's existence, not its internals) is surfaced as an open question for
the wisher. all other additions are prescribed and minimal. no speculative abstraction, config, or helper
was introduced.
