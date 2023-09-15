import { inject, injectable } from "tsyringe";
import { LogHandlerInterface } from "@pristine-ts/logging";
import { moduleScoped, tag } from "@pristine-ts/common";
import { AwsModuleKeyname } from "../aws.module.keyname";
import { S3ClientInterface } from "../interfaces/s3-client.interface";
import { GetObjectCommand, GetObjectCommandOutput, ListObjectsCommand, ListObjectsCommandOutput, PutObjectCommand, S3Client as AWSS3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { S3PresignedOperationTypeEnum } from "../enums/s3-presigned-operation-type.enum";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * The client to use to interact with AWS S3. It is a wrapper around the AWSS3Client of @aws-sdk/client-s3.
 * It is tagged so it can be injected using S3ClientInterface.
 */
@tag("S3ClientInterface")
@moduleScoped(AwsModuleKeyname)
@injectable()
export class S3Client implements S3ClientInterface {

    /**
     * The instantiated client from the @aws-sdk/client-s3 library.
     * @private
     */
    private client: AWSS3Client;

    /**
     * The client to use to interact with AWS S3. It is a wrapper around the AWSS3Client of @aws-sdk/client-s3.
     * @param logHandler The log handler used to output logs.
     * @param region The aws region for which the client will be used.
     */
    constructor(
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
        @inject("%pristine.aws.region%") public region: string,
    ) {
    }

    /**
     * Returns the instantiated AWSS3Client from the @aws-sdk/client-s3 library
     */
    getClient(): AWSS3Client {
        return this.client = this.client ?? new AWSS3Client({region: this.region});
    }

    /**
     * Allows you to manually set the config if needed.
     * @param config
     */
    setClient(config: S3ClientConfig) {
        this.client = new AWSS3Client(config);
    }

    /**
     * Gets an object and all its details from S3.
     * @param bucketName The bucket name where to get the object.
     * @param key The key of the object.
     */
    async get(bucketName: string, key: string): Promise<GetObjectCommandOutput> {
        this.logHandler.debug("S3 CLIENT - Getting item", {bucketName, key}, AwsModuleKeyname);
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

    /**
     * Gets an object's body as an array buffer from S3.
     * @param bucketName The bucket name where to get the object.
     * @param key The key of the object.
     */
    async getObjectBodyAsArrayBuffer(bucketName: string, key: string): Promise<ArrayBuffer> {
        try {
            const object = await this.get(bucketName, key);
            return this.streamToArrayBuffer(object.Body);
        } catch (e) {
            this.logHandler.error("Error getting content of object from S3", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Lists the keys of a bucket.
     * @param bucketName The name of the bucket.
     */
    async listKeys(bucketName: string): Promise<string[]> {
        this.logHandler.debug("S3 CLIENT - Listing bucket keys", {bucketName}, AwsModuleKeyname);
        const objects = await this.listObjects(bucketName)
        return objects.map((object) => object.Key);
    }

    /**
     * Lists the object of a bucket.
     * @param bucketName The name of the bucket.
     */
    async listObjects(bucketName: string): Promise<any[]> {
        this.logHandler.debug("S3 CLIENT - Listing bucket objects", {bucketName}, AwsModuleKeyname);
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

    /**
     * Uploads an object to a bucket of S3.
     * @param bucketName The name of the bucket.
     * @param key The key for the new object.
     * @param data The data to upload.
     * @param contentEncoding The encoding of the data to upload.
     * @param contentType The content type of the data to upload.
     */
    async upload(bucketName: string, key: string, data: any, contentEncoding?: string, contentType?: string): Promise<void> {
        this.logHandler.debug("S3 CLIENT - Uploading object", {bucketName, key, contentEncoding, contentType}, AwsModuleKeyname);

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

    /**
     * Creates a pre signed url to allow a third party to take action on S3.
     * @param bucketName The name of the bucket.
     * @param key The key for the object on which the action will be allowed.
     * @param operation The operation that will be allowed.
     * @param fileName If operation is Get, then a filename can be provided for the name of the file that will be downloaded.
     * @param expiresIn The amount on time in seconds before the pre signed url expires.
     */
    async createSignedUrl(bucketName: string, key: string, operation: S3PresignedOperationTypeEnum, fileName?: string, expiresIn: number = 300): Promise<string> {
        this.logHandler.debug("S3 CLIENT - Creating pre-signed url", {bucketName, key, operation, fileName, expiresIn}, AwsModuleKeyname);

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

    /**
     * Creates the S3 command for a pre signed url.
     * @param operation The operation that the pre signed url will allow.
     * @param bucketName The name of the bucket.
     * @param key The key for the object on which the action will be allowed.
     * @param fileName If operation is Get, then a filename can be provided for the name of the file that will be downloaded.
     * @private
     */
    private getCommandForPresign(operation: S3PresignedOperationTypeEnum, bucketName: string, key: string, fileName?: string): GetObjectCommand | PutObjectCommand {
        this.logHandler.debug("S3 CLIENT - Creating command for pre-signed url", {operation, bucketName, key, fileName}, AwsModuleKeyname);

        switch (operation) {
            case S3PresignedOperationTypeEnum.Get:
                return new GetObjectCommand({
                    Bucket: bucketName,
                    Key: key,
                    // This specifies the name of the file that will be downloaded rather than using the key.
                    ResponseContentDisposition: fileName ? `attachment; filename=${fileName}` : undefined,
                })
            case S3PresignedOperationTypeEnum.Upload:
                return new PutObjectCommand({
                    Bucket: bucketName,
                    Key: key,
                });
        }
    }

    /**
     * Transforms a stream to an array buffer.
     * @param stream The stream to transform.
     * @private
     */
    private async streamToArrayBuffer (stream): Promise<ArrayBuffer> {
        const chunks: Buffer[] = [];
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on('error', (err) => reject(err));
            stream.on('end', () => resolve(Buffer.concat(chunks).buffer));
        })
    }
}
