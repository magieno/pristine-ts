import {S3BucketModel} from "./s3-bucket.model";
import {S3ObjectModel} from "./s3-object.model";

/**
 * Model representing the object of the s3 event.
 */
export class S3Model {
  s3SchemaVersion: string;
  // ID found in the bucket notification configuration
  configurationId: string;
  bucket: S3BucketModel;
  object: S3ObjectModel;
}
