import {IdentityModel} from "./identity.model";

/**
 * Model representing the bucket of the s3 event.
 */
export class S3BucketModel {
    // Amazon-customer-ID-of-the-bucket-owner
    ownerIdentity: IdentityModel;
    name: string;
    arn: string;
}
