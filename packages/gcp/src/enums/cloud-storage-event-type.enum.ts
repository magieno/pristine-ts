/**
 * Event types coming from GCP Cloud Storage object change events delivered via CloudEvents.
 * CloudEvent `type` values map 1:1 with these enum values.
 */
export enum CloudStorageEventType {
  UnknownCloudStorageEvent = "UnknownCloudStorageEvent",
  ObjectFinalized = "google.cloud.storage.object.v1.finalized",
  ObjectDeleted = "google.cloud.storage.object.v1.deleted",
  ObjectArchived = "google.cloud.storage.object.v1.archived",
  ObjectMetadataUpdated = "google.cloud.storage.object.v1.metadataUpdated",
}
