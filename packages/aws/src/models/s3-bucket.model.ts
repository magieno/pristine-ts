import {IdentityModel} from "./identity.model";

export class S3BucketModel {
    // Amazon-customer-ID-of-the-bucket-owner
    ownerIdentity: IdentityModel;
    name: string;
    arn: string;
}
