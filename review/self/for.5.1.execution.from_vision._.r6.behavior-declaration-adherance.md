# self-review: behavior-declaration-adherance

checked: each changed file vs the vision, line by line. focus on the two spots easy to get wrong —
the condition path and the error class choice.

- condition path: `null` → `If-None-Match: *`; `<etag>` → `If-Match`. correct, no cross-wire.
- 412 → precondition error. 404-on-conditional → precondition error (a fenced delete of an absent
  key returns 404; still means the fence missed). 409 → conflict error. all else re-thrown.
- etag surfaced raw with quotes intact → round-trips back into `condition.etag` (case2 t0 proves it).
- both errors carry `cause` + a fix-hint (failloud).

drift: none. function-overload + optional-input departures are logged design calls, not misreads.

verdict: adheres.
