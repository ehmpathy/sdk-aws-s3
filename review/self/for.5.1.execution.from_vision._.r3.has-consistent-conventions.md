# self-review: has-consistent-conventions

## scope reviewed
all diff since main; compared against extant names and structural patterns.

## findings — aligned with extant conventions

- **names**: orchestrators keep the get/set/del verbs (extant public SDK surface). communicators use
  `getS3Object` / `setS3Object` / `deleteS3Object` — verb-first, domain-noun, consistent with the
  extant `asS3Ref` cast and the treestruct standard.
- **field term**: object bytes are named `body` everywhere (set input, get.one output, getAll
  output), unified on AWS's `Body` param. this removes the prior `content` divergence.
- **input shape**: `(input, context?)` held across all ops; `S3Ref<'object'>` union input fits the
  extant get/getAll/del signatures.
- **error classes**: `S3PreconditionFailedError` (ConstraintError) + `S3ConditionalConflictError`
  (MalfunctionError) follow the extant helpful-errors subclass convention.

## deliberate deviations (flagged, not drift)
- **`function` overloads** on get.one/set — TS requires the `function` keyword to express the
  wisher-mandated opt-in-meta return overloads (arrow-callable-type form fails TS2322 without a
  forbidden cast). documented as an open decision for the wisher.
- **optional `condition?`/`include?` inputs** — governed by `rule.prefer.optional-input-for-sdk-ux`,
  which overrides `rule.forbid.undefined-inputs` at public SDK boundaries.

## verdict
conventions consistent; the two deviations are deliberate and brief-backed, not drift.
