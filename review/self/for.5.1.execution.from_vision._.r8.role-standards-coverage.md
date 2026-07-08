# self-review: role-standards-coverage

goal of this pass: find omissions, not errors. i listed the test + doc rule dirs, then checked each
changed file for a practice that ought to be there but is not.

## dirs checked
scope.coverage, scope.unit, scope.integration, scope.acceptance, frames.behavior, lessons.howto,
readable.comments.

## practices confirmed present

- every operation has a test at the correct scope for its grain — transformers unit-tested, the
  error mapper unit-tested across all branches, communicators + orchestrators integration-tested
  against real s3, the contract acceptance-tested with locked snapshots.
- snapshots are always accompanied by an explicit value/instanceof assertion; live values (etag,
  body) stay deterministic via property matchers, error text via key substitution.
- zero mocks in integration/acceptance.
- what/why headers on each new file; bdd structure throughout.

## omissions i closed
two output variants had escaped snapshot coverage — get.one meta on an absent key, and the
precondition failure messages. both now carry acceptance snapshots, so the contract surface is fully
locked for review comparison.

## verdict
no required practice is omitted; the two coverage holes found were filled this pass.
