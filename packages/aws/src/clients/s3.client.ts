import { inject, injectable } from "tsyringe";
import { LogHandlerInterface } from "@pristine-ts/logging";
import { moduleScoped, tag } from "@pristine-ts/common";
import { AwsModuleKeyname } from "../aws.module.keyname";
import { S3ClientInterface } from "../interfaces/s3-client.interface";
import { GetObjectCommand, GetObjectCommandOutput, ListObjectsCommand, ListObjectsCommandOutput, PutObjectCommand, S3Client as AWSS3Client } from "@aws-sdk/client-s3";
import { S3PresignedOperationTypeEnum } from "../enums/s3-presigned-operation-type.enum";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import ReadableStream = NodeJS.ReadableStream;

@tag("S3ClientInterface")
@moduleScoped(AwsModuleKeyname)
@injectable()
export class S3Client implements S3ClientInterface {

    private client: AWSS3Client;

    constructor(
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
        @inject("%pristine.aws.region%") private readonly region: string,
    ) {
    }

    getClient(): AWSS3Client {
        if(this.client === undefined){
            this.client = new AWSS3Client({
                region: this.region,
            })
        }
        return this.client;
    }

    async get(bucketName: string, key: string): Promise<GetObjectCommandOutput> {
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        })
        try {
            return this.getClient().send(command);
        } catch (e) {
            this.logHandler.error("Error getting object from S3", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }

    async getObjectBodyArrayBuffer(bucketName: string, key: string): Promise<ArrayBuffer> {
        try {
            const object = await this.get(bucketName, key);
            return this.streamToArrayBuffer(object.Body);
        } catch (e) {
            this.logHandler.error("Error getting content of object from S3", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }

    async listKeys(bucketName: string): Promise<string[]> {
        const objects = await this.listObjects(bucketName)
        return objects.map((object) => object.Key);
    }

    async listObjects(bucketName: string): Promise<any[]> {
        const command = new ListObjectsCommand({
            Bucket: bucketName,
        })
        let objects: ListObjectsCommandOutput
        try {
            objects = await this.getClient().send(command);
        } catch (e) {
            this.logHandler.error("Error listing objects from S3", {error: e}, AwsModuleKeyname);
            throw e;
        }
        return objects.Contents ?? [];
    }

    async upload(bucketName: string, key: string, data: any, contentEncoding?: string, contentType?: string): Promise<void> {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: data,
            ContentType: contentType,
            ContentEncoding: contentEncoding,
        });

        try {
            await this.getClient().send(command);
        } catch (e) {
            this.logHandler.error("Error putting object in S3", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }

    async createSignedUrl(bucketName: string, key: string, operation: S3PresignedOperationTypeEnum, fileName?: string, expiresIn: number = 300): Promise<string> {
        const command = this.getCommandForPresign(operation, bucketName, key, fileName);
        let url;
        try {
            url = await getSignedUrl(this.getClient(), command, { expiresIn });
        } catch (e) {
            this.logHandler.error("Error getting signed url.", {error: e}, AwsModuleKeyname);
            throw e;
        }
        return url;
    }

    private getCommandForPresign(operation: S3PresignedOperationTypeEnum, bucketName: string, key: string, fileName?: string): GetObjectCommand | PutObjectCommand {
        switch (operation) {
            case S3PresignedOperationTypeEnum.Get:
                return new GetObjectCommand({
                    Bucket: bucketName,
                    Key: key,
                    ResponseContentDisposition: fileName ? `attachment; filename=${fileName}` : undefined,
                })
            case S3PresignedOperationTypeEnum.Upload:
                return new PutObjectCommand({
                    Bucket: bucketName,
                    Key: key,
                });
        }
    }

    private async streamToArrayBuffer (stream): Promise<ArrayBuffer> {
        const chunks: Buffer[] = [];
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on('error', (err) => reject(err));
            stream.on('end', () => resolve(Buffer.concat(chunks).buffer));
        })
    }
}
