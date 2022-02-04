import { S3PresignedOperationTypeEnum } from "../enums/s3-presigned-operation-type.enum";

export interface S3ClientInterface {
    get(bucketName: string, key: string): Promise<any>;
    listKeys(bucketName: string): Promise<string[]>;
    listObjects(bucketName: string): Promise<any[]>;
    upload(bucketName: string, key: string, data: any, contentEncoding?: string, contentType?: string): Promise<void>;
    createSignedUrl(bucketName: string, key: string, operation: S3PresignedOperationTypeEnum, fileName?: string, expiresIn?: number): Promise<string>;
}