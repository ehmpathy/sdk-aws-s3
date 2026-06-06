/**
 * .what = typed S3 reference types
 * .why = enforces correct input shape at compile time
 */

/**
 * .what = S3 reference by URI
 */
export interface S3RefByUri {
  uri: string;
}

/**
 * .what = S3 reference by bucket + key (for single object operations)
 */
export interface S3RefByObject {
  bucket: string;
  key: string;
}

/**
 * .what = S3 reference by bucket + prefix (for list operations)
 */
export interface S3RefByPrefix {
  bucket: string;
  prefix: string;
}

/**
 * .what = grain-to-ref map
 */
type S3RefGrainMap = {
  object: S3RefByObject;
  prefix: S3RefByPrefix;
};

/**
 * .what = typed S3 reference parameterized by grain
 * .why = enforces correct input shape at compile time
 *
 * @example
 * S3Ref<'object'>           // { uri } | { bucket, key }
 * S3Ref<'prefix'>           // { uri } | { bucket, prefix }
 * S3Ref                     // { uri } | { bucket, key } | { bucket, prefix }
 * S3Ref<'object' | 'prefix'> // same as S3Ref
 */
export type S3Ref<TGrain extends keyof S3RefGrainMap = keyof S3RefGrainMap> =
  | S3RefByUri
  | S3RefGrainMap[TGrain];
