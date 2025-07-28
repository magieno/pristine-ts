/**
 * Event types coming from S3 events
 */
export enum S3EventType {
  UnknownS3Event = "UnknownS3Event",
  ObjectCreatedPut = "ObjectCreated:Put",
  ObjectCreatedPost = "ObjectCreated:Post",
  ObjectCreatedCopy = "ObjectCreated:Copy",
  ObjectCreatedCompleteMultipartUpload = "ObjectCreated:CompleteMultipartUpload",
  ObjectRemovedDelete = "ObjectRemoved:Delete",
  ObjectRemovedDeleteMarkerCreated = "ObjectRemoved:DeleteMarkerCreated",
  ObjectRestorePost = "ObjectRestore:Post",
  ObjectRestoreCompleted = "ObjectRestore:Completed",
  ReducedRedundancyLostObject = "ReducedRedundancyLostObject",
  ReplicationOperationFailedReplication = "Replication:OperationFailedReplication",
  ReplicationOperationMissedThreshold = "Replication:OperationMissedThreshold",
  ReplicationOperationReplicatedAfterThreshold = "Replication:OperationReplicatedAfterThreshold",
  ReplicationOperationNotTracked = "Replication:OperationNotTracked",
}
