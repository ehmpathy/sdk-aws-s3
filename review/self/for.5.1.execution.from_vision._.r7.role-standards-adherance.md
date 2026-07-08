# self-review: role-standards-adherance

i re-read the diff to catch any anti-pattern a rushed junior might slip in. the standards i weighed:
arrow-only, input-context, get/set/gen verbs, failfast/failloud/no-failhide, narrative
orchestrators, what-why headers, no barrels.

what i confirmed compliant:

- the raw s3 calls now sit in `getS3Object` / `setS3Object` / `deleteS3Object`; the three
  orchestrators read as a short story, not a machine dump.
- the catch blocks never swallow: the mapper re-throws every code outside 412/404/409, and the
  no-etag path throws `UnexpectedCodePathError` instead of a silent undefined return.
- every op takes `(input, context?)`, one export per file, header comment on each.
- `contract/index.ts` exports one object + two error classes — zero forwarders.

the lone deviation: `function` on the two overload sets. it is not sloppiness — TS rejects the
arrow-callable form of the opt-in-meta overload (TS2322) unless i add a forbidden `as`. i logged it
as an open call for the wisher rather than hide it.

verdict: compliant, with the one compiler-forced exception surfaced.
