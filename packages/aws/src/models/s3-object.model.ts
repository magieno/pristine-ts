/**
 * Model representing the object of the s3 event.
 */
export class S3ObjectModel {
    key: string;
    size: number;
    eTag: string;
    // Object version if bucket is versioning-enabled, otherwise null
    versionId?: string;
    // A string representation of a hexadecimal value used to determine event sequence, only used with PUTs and DELETEs
    sequencer?: string;
}
