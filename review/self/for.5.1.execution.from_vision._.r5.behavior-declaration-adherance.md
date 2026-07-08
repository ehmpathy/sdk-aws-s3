# self-review: behavior-declaration-adherance

## method
file by file, i asked one question of each line: does this do what the vision describes, or did it
quietly drift? i cared most about the condition + error semantics, since those are the parts easy to
get subtly wrong.

## where the code holds to the spec

- **null vs value split is honored** — `asS3ConditionHeaders` treats `etag: null` as "must not
  exist" (`If-None-Match: *`) and a string etag as "must match" (`If-Match`). the two intents never
  cross-wire.
- **status codes land on the right type** — 412 → precondition-failed; a 404 on a conditional op is
  folded into precondition-failed too (empirically a conditional delete of an absent key returns
  404, and that still means "your fence did not hold"); 409 → conflict. each code outside those is
  re-thrown untouched, so unrelated failures are never swallowed.
- **the etag is passed through raw** — quotes preserved, no trim or re-wrap — so a value read from
  get.one meta round-trips straight back into `condition.etag`. case2 t0 proves the round-trip
  actually overwrites.
- **errors are loud** — each typed error carries the original s3 error as `cause` plus a fix-hint
  that tells the caller what to do next.

## drift
none found. the two known departures (function overloads, optional inputs) are deliberate design
calls, documented in the conventions review — not misreadings of the spec.

## verdict
implementation adheres to the declared behavior.
