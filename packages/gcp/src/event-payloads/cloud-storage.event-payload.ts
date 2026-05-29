/**
 * The Pristine event payload for a parsed GCP Cloud Storage CloudEvent.
 * Mirrors `S3EventPayload` in spirit.
 */
export class CloudStorageEventPayload {
  /**
   * The CloudEvent `type` (e.g. `google.cloud.storage.object.v1.finalized`).
   */
  eventType: string;

  /**
   * The CloudEvent `source` (e.g. `//storage.googleapis.com/projects/_/buckets/my-bucket`).
   */
  source: string;

  /**
   * The CloudEvent `time`, parsed.
   */
  eventTime?: Date;

  /**
   * The bucket name extracted from the event's `data` payload.
   */
  bucket: string;

  /**
   * The object name (path within the bucket).
   */
  name: string;

  /**
   * The generation number of the object.
   */
  generation?: string;

  /**
   * The metageneration number of the object.
   */
  metageneration?: string;

  /**
   * The MIME content type of the object.
   */
  contentType?: string;

  /**
   * The object size in bytes (as a string — Cloud Storage returns int64 as string).
   */
  size?: string;

  /**
   * The MD5 hash of the object (base64-encoded).
   */
  md5Hash?: string;

  /**
   * The CRC32C checksum of the object (base64-encoded).
   */
  crc32c?: string;

  /**
   * The raw `data` field from the CloudEvent — kept verbatim for consumers that need
   * fields not promoted above.
   */
  data: any;
}
