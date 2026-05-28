/**
 * Event types coming from GCP Firestore document change events delivered via CloudEvents.
 * CloudEvent `type` values map 1:1 with these enum values.
 */
export enum FirestoreEventType {
  UnknownFirestoreEvent = "UnknownFirestoreEvent",
  DocumentCreated = "google.cloud.firestore.document.v1.created",
  DocumentUpdated = "google.cloud.firestore.document.v1.updated",
  DocumentDeleted = "google.cloud.firestore.document.v1.deleted",
  DocumentWritten = "google.cloud.firestore.document.v1.written",
}
