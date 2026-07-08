# self-review: role-standards-adherance

## rule dirs enumerated
code.prod/evolvable.procedures · code.prod/evolvable.architecture ·
code.prod/evolvable.domain.operations · code.prod/pitofsuccess.errors ·
code.prod/readable.narrative · code.prod/readable.comments

## line-by-line verdict — clean

- **orchestrators read as prose**: get.one/set/del each delegate the raw send to a communicator;
  no IIFE, no inline try/catch, no `transformToString`/`ETag` parse in the orchestrator body.
- **errors fail fast + loud, never hide**: the mapper allowlists 412/404/409 and re-throws all
  else; the no-etag branch guards with `UnexpectedCodePathError.throw`; typed errors carry cause +
  hint. no catch-and-swallow anywhere.
- **(input, context?) everywhere**; no positional args.
- **one op per file, filename === export**; jsdoc `.what`/`.why` on every new file.
- **no barrel exports**: `contract/index.ts` ships the single `sdkAwsS3` object plus the two error
  classes; no re-export forwarders.

## the one standard i knowingly bent
`function` keyword on the get.one/set overloads. arrow-only is the rule, but TS cannot type the
opt-in-meta return overload as an arrow-callable without a banned cast. i took the compiler-legal
form and flagged it rather than reach for `as`.

## verdict
adheres; the single bend is TS-forced and surfaced, not a sloppy anti-pattern.
