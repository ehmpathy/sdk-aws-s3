# self-review: has-pruned-backcompat

## scope reviewed
all diff since main.

## findings — no unrequested backwards-compat

- the **default (no-meta) return shapes** on get.one/set are preserved via overloads, but this is
  the wisher's explicit opt-in-meta design (additive capability), not a backcompat shim added "to
  be safe." callers who never pass `include` see the identical prior contract by design.
- the **`del` verb**, **`S3Ref` union input**, and **optional `condition?`/`include?` inputs** are
  extant conventions of this SDK, not new compatibility layers introduced by this wish.
- no versioned branches, no deprecated aliases, no "legacy" fallbacks were added.

## non-issues (why they hold)
pre-1.0 breaking renames were made where honest (the `content` → `body` field unification on AWS's
`Body`), rather than kept dual for compatibility — the vision-yield documents this as the single
intended break. that is the opposite of unrequested backcompat.

## verdict
no unrequested backwards-compat to prune.
