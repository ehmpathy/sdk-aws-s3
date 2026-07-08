/**
 * .what = transformer that interprets a prefix-grain input as a parsed object ref
 * .why = getAll accepts either { uri } or { bucket, prefix }; the bucket/prefix form names
 *        its key field `prefix`, but the parser + list command both speak `key`. this names
 *        that remap so the getAll orchestrator stays a narrative (no inline ternary decode).
 */
import type { S3Ref, S3RefByObject } from '../../domain.objects/S3Ref';
import { asS3Ref } from './asS3Ref';

export const asS3RefFromPrefixInput = (input: S3Ref<'prefix'>): S3RefByObject =>
  // remap the prefix field to key, then parse (uri form parses as-is)
  asS3Ref(
    'prefix' in input ? { bucket: input.bucket, key: input.prefix } : input,
  );
