# sdk-aws-s3

![test](https://github.com/ehmpathy/sdk-aws-s3/workflows/test/badge.svg)
![publish](https://github.com/ehmpathy/sdk-aws-s3/workflows/publish/badge.svg)

simple, ergonomic, intuitive pit-of-success for aws s3

# install

```sh
npm install sdk-aws-s3
```

# use

```ts
import { sdkAwsS3 } from 'sdk-aws-s3';

// get one
const object = await sdkAwsS3.get.one({ bucket: 'my-bucket', key: 'data.json' });

// get all (by prefix)
const objects = await sdkAwsS3.get.all({ bucket: 'my-bucket', prefix: 'uploads/' });

// set (idempotent upsert)
await sdkAwsS3.set({
  bucket: 'my-bucket',
  key: 'data.json',
  body: JSON.stringify({ hello: 'world' }),
});

// del (idempotent, no-op if not found)
await sdkAwsS3.del({ bucket: 'my-bucket', key: 'data.json' });
```

that's it. no client setup, no configuration, no boilerplate.

# why

the raw aws s3 sdk is powerful but verbose:

```ts
// raw sdk — verbose, error-prone
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const client = new S3Client({ region: 'us-east-1' });
const response = await client.send(
  new GetObjectCommand({ Bucket: 'my-bucket', Key: 'data.json' }),
);
const body = await response.Body?.transformToString();
```

```ts
// sdk-aws-s3 — simple, intuitive
import { sdkAwsS3 } from 'sdk-aws-s3';

const object = await sdkAwsS3.get.one({ bucket: 'my-bucket', key: 'data.json' });
```

| footgun | pit-of-success |
|---------|---------------|
| verbose client setup | zero config |
| easy to forget error handlers | errors surfaced loudly |
| stream handling complexity | automatic body resolution |
| no built-in retry | idempotent operations safe to retry |

# design

## get/set/del

all operations follow simple, idempotent semantics:

| operation | behavior |
|-----------|----------|
| `sdkAwsS3.get.one` | retrieve object, return null if not found |
| `sdkAwsS3.get.all` | list objects by prefix |
| `sdkAwsS3.set` | upsert object (create or overwrite) |
| `sdkAwsS3.del` | delete object, no-op if not found |
