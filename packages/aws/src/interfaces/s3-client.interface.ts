import { S3PresignedOperationTypeEnum } from "../enums/s3-presigned-operation-type.enum";
import { GetObjectCommandOutput, S3Client as AWSS3Client  } from "@aws-sdk/client-s3";
import ReadableStream = NodeJS.ReadableStream;

export interface S3ClientInterface {
    getClient(): AWSS3Client;
    get(bucketName: string, key: string): Promise<GetObjectCommandOutput>;
    getObjectBodyArrayBuffer(bucketName: string, key: string): Promise<ArrayBuffer>;
    listKeys(bucketName: string): Promise<string[]>;
    listObjects(bucketName: string): Promise<any[]>;
    upload(bucketName: string, key: string, data: any, contentEncoding?: string, contentType?: string): Promise<void>;
    createSignedUrl(bucketName: string, key: string, operation: S3PresignedOperationTypeEnum, fileName?: string, expiresIn?: number): Promise<string>;
}
