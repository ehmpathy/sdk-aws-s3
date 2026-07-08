# self-review: has-consistent-conventions

## how i checked
i walked each changed file and matched every name + structural choice against what already lives in
`src/domain.operations/` and `src/domain.objects/`, to catch any divergence in prefix, suffix,
namespace, or term.

## what matched the codebase

1. **verb prefixes** — the public ops stay on `get` / `set` / `del`, exactly the surface that
   shipped before. the new leaf files carry a verb-first noun (`getS3Object`, `setS3Object`,
   `deleteS3Object`), which mirrors how `asS3Ref` already reads.
2. **one term per concept** — object bytes are `body` in every position now. the earlier split
   (`content` in some spots) is gone, so the SDK speaks AWS's own `Body` word end to end.
3. **argument contract** — `(input, context?)` is untouched; the `S3Ref<'object'>` discriminated
   input is the same union the prior three ops accept.
4. **error taxonomy** — both new errors extend the same helpful-errors bases the repo already leans
   on (`ConstraintError` for caller-fault, `MalfunctionError` for infra-fault).

## two conscious breaks from convention (surfaced, not hidden)

- the `function` keyword appears on the get.one/set overload signatures. the arrow-only rule would
  forbid it, but the compiler forces it: the opt-in-meta return overload the wisher asked for cannot
  be spelled with an arrow-callable type absent a banned `as` cast. i chose the TS-legal form and
  logged the tension.
- `condition?` and `include?` stay optional. that is the SDK-UX brief's explicit carve-out from the
  no-undefined-inputs rule, so callers never type `condition: null` for the ordinary path.

## verdict
names and structure track the extant conventions; the only two departures are compiler-forced or
brief-sanctioned, and both are called out rather than buried.
