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

// via uri
const object = await sdkAwsS3.get.one({ uri: 's3://my-bucket/data.json' });
const objects = await sdkAwsS3.get.all({ uri: 's3://my-bucket/uploads/' });
await sdkAwsS3.set({ uri: 's3://my-bucket/data.json', body: '{"hello":"world"}' });
await sdkAwsS3.del({ uri: 's3://my-bucket/data.json' });

// via bucket + key
const object = await sdkAwsS3.get.one({ bucket: 'my-bucket', key: 'data.json' });
const objects = await sdkAwsS3.get.all({ bucket: 'my-bucket', prefix: 'uploads/' });
await sdkAwsS3.set({ bucket: 'my-bucket', key: 'data.json', body: '{"hello":"world"}' });
await sdkAwsS3.del({ bucket: 'my-bucket', key: 'data.json' });
```

that's it. no client setup, no configuration, no boilerplate.

## uri format

```
s3://bucket/path/to/key
```

parsed as:
- scheme: `s3://`
- bucket: first path segment
- key: rest of path

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

const object = await sdkAwsS3.get.one({ uri: 's3://my-bucket/data.json' });
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

## context injection

all operations accept optional context for client reuse:

```ts
import { S3Client } from '@aws-sdk/client-s3';
import { sdkAwsS3 } from 'sdk-aws-s3';

const client = new S3Client({ region: 'us-east-1' });

const object = await sdkAwsS3.get.one(
  { uri: 's3://my-bucket/data.json' },
  { aws: { s3: { client } } },
);
```
