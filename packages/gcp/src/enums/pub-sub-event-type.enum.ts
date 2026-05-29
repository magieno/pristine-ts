/**
 * Event types coming from GCP Pub/Sub. Pub/Sub itself only has one delivery shape
 * (a message), so unlike S3 we don't enumerate sub-operations here.
 */
export enum PubSubEventType {
  Message = "PUB_SUB_MESSAGE",
  UnknownPubSubEvent = "UnknownPubSubEvent",
}
