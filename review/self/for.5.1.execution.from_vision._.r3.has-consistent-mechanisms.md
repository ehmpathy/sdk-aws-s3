# self-review: has-consistent-mechanisms

## scope reviewed
all diff since main; searched domain.operations/ for related codepaths and extant utilities.

## findings — no duplicated functionality

- the **3 communicators** share one consistent shape: get-or-create client → map condition headers
  (via the shared `asS3ConditionHeaders`) → send command → map errors (via the shared
  `throwMappedS3ConditionError`). they do not each reinvent header-map or error-map logic.
- **`asS3Ref`** is reused by all 3 orchestrators for input parse; not duplicated.
- **`asS3ConditionHeaders`** is the single translator of `condition` → If-None-Match/If-Match
  headers, reused by both the set + del paths.
- **`throwMappedS3ConditionError`** is the single 412/404/409 mapper, reused by set + del.

## non-issues (why they hold)
the client-get line (`context?.aws?.s3?.client ?? new S3Client({})`) repeats across communicators.
this is intentional per wet-over-dry: 3 short identical lines at the raw i/o boundary, each the
minimum, beats a premature shared factory. it also fits the extant getAll pattern, which resolves
its client the same way.

## verdict
no mechanism duplicates extant functionality; shared logic sits behind shared transformers.
