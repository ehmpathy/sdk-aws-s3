/**
 * .what = orchestrator that fetches all objects with a prefix from S3
 * .why = provides ergonomic list + fetch operation with pagination
 *
 * .note = BREAKING (pre-1.0): the result field was renamed `content` → `body`, so the shape
 *         is now `{ key; body }[]`. this unifies the object-bytes term on aws's `Body`
 *         (the s3 SDK exposes bytes as `Body`; `Content-*` names the payload's metadata, not
 *         the payload). migration: callers that destructure `.content` must read `.body`.
 */
import { ListObjectsV2Command, type S3Client } from '@aws-sdk/client-s3';

import type { ContextSdkAwsS3 } from '../domain.objects/ContextSdkAwsS3';
import type { S3Ref } from '../domain.objects/S3Ref';
import { getS3Client } from './getS3Client';
import { getS3Object } from './object/getS3Object';
import { asS3RefFromPrefixInput } from './ref/asS3RefFromPrefixInput';

/**
 * .what = fetch every key under a prefix, one page at a time, via recursion
 * .why = walks s3 pagination without mutable accumulator state; each page
 *        concats onto the rest, so the walk stays immutable
 */
const getAllKeysUnderPrefix = async (input: {
  client: S3Client;
  bucket: string;
  prefix: string;
  token: string | null;
}): Promise<string[]> => {
  // fetch one page of keys
  const response = await input.client.send(
    new ListObjectsV2Command({
      Bucket: input.bucket,
      Prefix: input.prefix,
      ContinuationToken: input.token ?? undefined,
    }),
  );

  // keys present on this page
  const keysOnPage = (response.Contents ?? [])
    .map((object) => object.Key)
    .filter((key): key is string => !!key);

  // last page → these keys are all that is left
  if (!response.NextContinuationToken) return keysOnPage;

  // otherwise, concat this page onto the rest of the pages
  const keysOnRest = await getAllKeysUnderPrefix({
    ...input,
    token: response.NextContinuationToken,
  });
  return [...keysOnPage, ...keysOnRest];
};

/**
 * .what = fetch the body for each key, in order; any that came back absent are left out
 * .why = keeps the getAll orchestrator a narrative; the in-order fetch + null-drop is
 *        one named step here, done via recursion so it stays immutable (no push/reduce)
 *
 * .note = the null-drop is deliberate eventual-consistency behavior, not failhide. list +
 *         get is a two-step read; a key can be deleted in the window between the list and
 *         its get, so it lists then 404s. we intentionally omit such keys, so getAll yields
 *         the objects that were present at fetch time. this makes getAll robust to concurrent
 *         deletes (it does not throw when a listed key vanishes). the drop is pinned by an
 *         integration test (getAll.integration.test.ts, "key deleted between list and fetch").
 */
const getBodiesForKeys = async (
  input: { keys: string[]; bucket: string },
  context?: ContextSdkAwsS3,
): Promise<Array<{ key: string; body: string }>> => {
  // base case: no keys left → empty
  const [keyFirst, ...keysRest] = input.keys;
  if (keyFirst === undefined) return [];

  // fetch this key's body via the leaf communicator, then the rest (sequential, in order)
  const object = await getS3Object(
    { ref: { bucket: input.bucket, key: keyFirst } },
    context,
  );
  const rest = await getBodiesForKeys(
    { keys: keysRest, bucket: input.bucket },
    context,
  );

  // leave this key out if it (or its body) came back absent (null)
  const body = object?.body ?? null;
  return body === null ? rest : [{ key: keyFirst, body }, ...rest];
};

export const getAll = async (
  input: S3Ref<'prefix'>,
  context?: ContextSdkAwsS3,
): Promise<Array<{ key: string; body: string }>> => {
  // parse the prefix input to bucket + key
  const ref = asS3RefFromPrefixInput(input);

  // get or create client
  const client = getS3Client({ context });

  // list all keys under the prefix (paginated)
  const keys = await getAllKeysUnderPrefix({
    client,
    bucket: ref.bucket,
    prefix: ref.key,
    token: null,
  });

  // fetch each key's body, in order
  return getBodiesForKeys({ keys, bucket: ref.bucket }, context);
};
