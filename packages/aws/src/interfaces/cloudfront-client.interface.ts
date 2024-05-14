import { S3PresignedOperationTypeEnum } from "../enums/s3-presigned-operation-type.enum";
import {GetObjectCommandOutput, S3Client as AWSS3Client, S3ClientConfig} from "@aws-sdk/client-s3";
import {CloudFormationClient as AWSCloudformationClient} from "@aws-sdk/client-cloudformation/dist-types/CloudFormationClient";
import {
    CreateStackCommandInput,
    CreateStackCommandOutput,
    DeleteStackCommandInput, DeleteStackCommandOutput,
    Stack, UpdateStackCommandInput, UpdateStackCommandOutput
} from "@aws-sdk/client-cloudformation";
import {CloudFormationClientConfig} from "@aws-sdk/client-cloudformation/dist-types/ts3.4";
import {
    CloudFrontClient as AWSCloudFrontClient,
    CloudFrontClientConfig
} from "@aws-sdk/client-cloudfront/dist-types/CloudFrontClient";
import {CloudfrontClient} from "../clients/cloudfront.client";
import {CreateInvalidationResult, GetInvalidationResult} from "@aws-sdk/client-cloudfront";
import {ClientOptionsInterface} from "./client-options.interface";

/**
 * The CloudfrontClientInterface Interface defines the methods that a Cloudfront client must implement.
 * When injecting the Cloudfront client the 'CloudfrontClientInterface' tag should be used.
 */
export interface CloudfrontClientInterface {
    /**
     * Returns the instantiated CloudFrontClient from the @aws-sdk/client-cloudfront
     */
    getClient(): AWSCloudFrontClient;

    /**
     * Allows you to manually set the config if needed.
     * @param config
     */
    setClient(config: CloudFrontClientConfig);

    /**
     * Invalidates all the provided paths.
     *
     * @param distributionId
     * @param paths
     * @param options
     */
    invalidate(distributionId: string, paths: string[], options?: Partial<ClientOptionsInterface>):  Promise<CreateInvalidationResult>

    /**
     * Returns the status of the invalidation
     *
     * @param distributionId
     * @param invalidationId
     * @param options
     */
    getInvalidation(distributionId: string, invalidationId: string, options?: Partial<ClientOptionsInterface>): Promise<GetInvalidationResult>
}
