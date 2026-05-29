/**
 * The operation a signed URL grants on a Cloud Storage object. Mirrors
 * `S3PresignedOperationTypeEnum` in `@pristine-ts/aws`.
 */
export enum CloudStoragePresignedOperationTypeEnum {
  Read = "read",
  Write = "write",
}
