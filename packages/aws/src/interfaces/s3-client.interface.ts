import {S3PresignedOperationTypeEnum} from "../enums/s3-presigned-operation-type.enum";
import {
  Bucket,
  GetObjectCommandOutput,
  ListObjectsV2CommandOutput,
  S3Client as AWSS3Client,
  S3ClientConfig
} from "@aws-sdk/client-s3";
import {ClientOptionsInterface} from "./client-options.interface";
import {Readable} from "stream";

/**
 * The S3Client Interface defines the methods that an S3 client must implement.
 * When injecting the S3 client the 'S3ClientInterface' tag should be used.
 */
export interface S3ClientInterface {
  /**
   * Returns the instantiated AWSS3Client from the @aws-sdk/client-s3 library
   */
  getClient(): AWSS3Client;

  /**
   * Allows you to manually set the config if needed.
   * @param config
   */
  setClient(config: S3ClientConfig);

  /**
   * Retrieves the key from the S3 Bucket.
   * @param bucketName
   * @param key
   * @param options
   */
  get(bucketName: string, key: string, options?: Partial<ClientOptionsInterface>): Promise<GetObjectCommandOutput>

  /**
   * Gets an object's body as an array buffer from S3.
   * @param bucketName The bucket name where to get the object.
   * @param key The key of the object.
   * @param options
   */
  getObjectBodyAsArrayBuffer(bucketName: string, key: string, options?: Partial<ClientOptionsInterface>): Promise<ArrayBuffer>;

  /**
   * Lists the keys of a bucket.
   * @param bucketName The name of the bucket.
   * @param options
   */
  listKeys(bucketName: string, options?: Partial<ClientOptionsInterface>): Promise<string[]>;

  /**
   * Lists the object of a bucket.
   * @param bucketName The name of the bucket.
   * @param options
   */
  listObjects(bucketName: string, options?: Partial<ClientOptionsInterface>): Promise<any[]>;

  /**
   * Lists the buckets.
   * @param options
   */
  listBuckets(options?: Partial<ClientOptionsInterface>): Promise<Bucket[]>;

  /**
   * Uploads an object to a bucket of S3.
   * @param bucketName The name of the bucket.
   * @param key The key for the new object.
   * @param data The data to upload.
   * @param contentEncoding The encoding of the data to upload.
   * @param contentType The content type of the data to upload.
   * @param options
   */
  upload(bucketName: string, key: string, data: any, contentEncoding?: string, contentType?: string, options?: Partial<ClientOptionsInterface>): Promise<void>;

  /**
   * Creates a pre signed url to allow a third party to take action on S3.
   * @param bucketName The name of the bucket.
   * @param key The key for the object on which the action will be allowed.
   * @param operation The operation that will be allowed.
   * @param fileName If operation is Get, then a filename can be provided for the name of the file that will be downloaded.
   * @param expiresIn The amount on time in seconds before the pre signed url expires.
   */
  createSignedUrl(bucketName: string, key: string, operation: S3PresignedOperationTypeEnum, fileName?: string, expiresIn?: number): Promise<string>;

  /**
   * Deletes an object from S3.
   * @param bucketName The name of the bucket.
   * @param key The key of the object.
   * @param options
   */
  deleteObject(bucketName: string, key: string, options?: Partial<ClientOptionsInterface>): Promise<void>;

  /**
   * Downloads an object from S3.
   * @param bucketName The name of the bucket.
   * @param key The key of the object.
   * @param options
   */
  download(bucketName: string, key: string, options?: Partial<ClientOptionsInterface>): Promise<Readable | ReadableStream | Blob>;

  /**
   * Lists the objects in a bucket with a directory-like structure.
   * @param bucketName The name of the bucket.
   * @param prefix The prefix (directory) to list.
   * @param continuationToken The continuation token for pagination.
   * @param maxKeys The maximum number of keys to return.
   * @param options
   */
  listDirectory(bucketName: string, prefix?: string, continuationToken?: string, maxKeys?: number, options?: Partial<ClientOptionsInterface>): Promise<ListObjectsV2CommandOutput>;
}
