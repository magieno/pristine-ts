export class S3EventPayload {
    eventVersion: string;
    eventSource: string;
    awsRegion: string;
    // The time when Amazon S3 finished processing the request
    eventTime: Date;
    eventName: string;
    userIdentity:{
        // Amazon-customer-ID-of-the-user-who-caused-the-event
        principalId: string;
    };
    requestParameters:{
        // ip-address-where-request-came-from
        sourceIPAddress:string;
    };
    responseElements:{
        // Amazon S3 generated request ID
        "x-amz-request-id":string;
        // Amazon S3 host that processed the request
        "x-amz-id-2":string;
    };
    s3: {
        s3SchemaVersion: string;
        // ID found in the bucket notification configuration
        configurationId: string;
        bucket: {
            ownerIdentity:{
                // Amazon-customer-ID-of-the-bucket-owner
                principalId:string;
            };
            name: string;
            arn: string;
        };
        object: {
            key: string;
            size: number;
            eTag: string;
            // Object version if bucket is versioning-enabled, otherwise null
            versionId?: string;
            // A string representation of a hexadecimal value used to determine event sequence, only used with PUTs and DELETEs
            sequencer?: string;
        };
    }
}
