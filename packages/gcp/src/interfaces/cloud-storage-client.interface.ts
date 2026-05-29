import {Storage} from "@google-cloud/storage";
import {Readable} from "stream";
import {CloudStoragePresignedOperationTypeEnum} from "../enums/cloud-storage-presigned-operation-type.enum";
import {GcpClientOptionsInterface} from "./client-options.interface";

export interface CloudStorageClientInterface {
  getClient(): Storage;

  get(bucketName: string, key: string, options?: Partial<GcpClientOptionsInterface>): Promise<Buffer>;

  getObjectBodyAsArrayBuffer(bucketName: string, key: string, options?: Partial<GcpClientOptionsInterface>): Promise<ArrayBuffer>;

  listKeys(bucketName: string, prefix?: string, options?: Partial<GcpClientOptionsInterface>): Promise<string[]>;

  upload(bucketName: string, key: string, data: Buffer | string | Readable, contentType?: string, contentEncoding?: string, options?: Partial<GcpClientOptionsInterface>): Promise<void>;

  download(bucketName: string, key: string, options?: Partial<GcpClientOptionsInterface>): Promise<Readable>;

  deleteObject(bucketName: string, key: string, options?: Partial<GcpClientOptionsInterface>): Promise<void>;

  createSignedUrl(bucketName: string, key: string, operation: CloudStoragePresignedOperationTypeEnum, expiresInSeconds?: number): Promise<string>;
}
