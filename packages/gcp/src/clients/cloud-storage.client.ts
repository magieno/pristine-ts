import {inject, injectable} from "tsyringe";
import {injectConfig, moduleScoped, tag, traced} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {Storage} from "@google-cloud/storage";
import {Readable} from "stream";
import {GcpModuleKeyname} from "../gcp.module.keyname";
import {GcpConfigurationKeys} from "../gcp.configuration-keys";
import {CloudStorageClientInterface} from "../interfaces/cloud-storage-client.interface";
import {GcpClientOptionsInterface} from "../interfaces/client-options.interface";
import {CloudStoragePresignedOperationTypeEnum} from "../enums/cloud-storage-presigned-operation-type.enum";

/**
 * Client for Google Cloud Storage. Mirrors `S3Client` in `@pristine-ts/aws`.
 */
@tag("CloudStorageClientInterface")
@moduleScoped(GcpModuleKeyname)
@injectable()
export class CloudStorageClient implements CloudStorageClientInterface {
  private client?: Storage;

  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    @injectConfig(GcpConfigurationKeys.ProjectId) private readonly projectId: string,
  ) {
  }

  getClient(): Storage {
    return this.client = this.client ?? new Storage({projectId: this.projectId});
  }

  @traced()
  async get(bucketName: string, key: string, options?: Partial<GcpClientOptionsInterface>): Promise<Buffer> {
    this.logHandler.debug("CloudStorageClient: Downloading object.", {extra: {bucketName, key}});
    try {
      const [contents] = await this.getClient().bucket(bucketName).file(key).download();
      return contents;
    } catch (e) {
      this.logHandler.error("CloudStorageClient: Error downloading object.", {extra: {error: e, bucketName, key}});
      throw e;
    }
  }

  @traced()
  async getObjectBodyAsArrayBuffer(bucketName: string, key: string, options?: Partial<GcpClientOptionsInterface>): Promise<ArrayBuffer> {
    const buffer = await this.get(bucketName, key, options);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  }

  @traced()
  async listKeys(bucketName: string, prefix?: string, options?: Partial<GcpClientOptionsInterface>): Promise<string[]> {
    this.logHandler.debug("CloudStorageClient: Listing keys.", {extra: {bucketName, prefix}});
    try {
      const [files] = await this.getClient().bucket(bucketName).getFiles({prefix});
      return files.map((file) => file.name);
    } catch (e) {
      this.logHandler.error("CloudStorageClient: Error listing keys.", {extra: {error: e, bucketName}});
      throw e;
    }
  }

  @traced()
  async upload(
    bucketName: string,
    key: string,
    data: Buffer | string | Readable,
    contentType?: string,
    contentEncoding?: string,
    options?: Partial<GcpClientOptionsInterface>,
  ): Promise<void> {
    this.logHandler.debug("CloudStorageClient: Uploading object.", {extra: {bucketName, key, contentType, contentEncoding}});
    try {
      const file = this.getClient().bucket(bucketName).file(key);
      if (data instanceof Readable) {
        await new Promise<void>((resolve, reject) => {
          data
            .pipe(file.createWriteStream({metadata: {contentType, contentEncoding}}))
            .on("finish", () => resolve())
            .on("error", reject);
        });
      } else {
        await file.save(data, {metadata: {contentType, contentEncoding}});
      }
    } catch (e) {
      this.logHandler.error("CloudStorageClient: Error uploading object.", {extra: {error: e, bucketName, key}});
      throw e;
    }
  }

  @traced()
  async download(bucketName: string, key: string, options?: Partial<GcpClientOptionsInterface>): Promise<Readable> {
    this.logHandler.debug("CloudStorageClient: Streaming object.", {extra: {bucketName, key}});
    return this.getClient().bucket(bucketName).file(key).createReadStream();
  }

  @traced()
  async deleteObject(bucketName: string, key: string, options?: Partial<GcpClientOptionsInterface>): Promise<void> {
    this.logHandler.debug("CloudStorageClient: Deleting object.", {extra: {bucketName, key}});
    try {
      await this.getClient().bucket(bucketName).file(key).delete();
    } catch (e) {
      this.logHandler.error("CloudStorageClient: Error deleting object.", {extra: {error: e, bucketName, key}});
      throw e;
    }
  }

  /**
   * Creates a V4 signed URL granting `operation` on the object for `expiresInSeconds`.
   */
  @traced()
  async createSignedUrl(
    bucketName: string,
    key: string,
    operation: CloudStoragePresignedOperationTypeEnum,
    expiresInSeconds: number = 300,
  ): Promise<string> {
    this.logHandler.debug("CloudStorageClient: Creating signed URL.", {extra: {bucketName, key, operation, expiresInSeconds}});
    try {
      const [url] = await this.getClient().bucket(bucketName).file(key).getSignedUrl({
        version: "v4",
        action: operation === CloudStoragePresignedOperationTypeEnum.Read ? "read" : "write",
        expires: Date.now() + expiresInSeconds * 1000,
      });
      return url;
    } catch (e) {
      this.logHandler.error("CloudStorageClient: Error creating signed URL.", {extra: {error: e, bucketName, key, operation}});
      throw e;
    }
  }
}
