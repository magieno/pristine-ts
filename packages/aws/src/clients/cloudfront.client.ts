import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {moduleScoped, tag} from "@pristine-ts/common";
import {AwsModuleKeyname} from "../aws.module.keyname";
import {
    CloudFrontClient as AWSCloudFrontClient,
    CloudFrontClientConfig,
    CreateInvalidationCommand, CreateInvalidationResult, GetInvalidationCommand, GetInvalidationResult
} from "@aws-sdk/client-cloudfront"
import {CloudfrontClientInterface} from "../interfaces/cloudfront-client.interface";
import {DescribeStacksCommand, DescribeStacksCommandOutput} from "@aws-sdk/client-cloudformation";
import { v4 as uuidv4 } from 'uuid';

/**
 * The client to use to interact with AWS Cloudformation. It is a wrapper around the Cloudfront of @aws-sdk/client-cloudfront.
 * It is tagged so it can be injected using CloudfrontClientInterface.
 * AWS documentation https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/cloudfront/
 */
@tag("CloudfrontClientInterface")
@moduleScoped(AwsModuleKeyname)
@injectable()
export class CloudfrontClient implements CloudfrontClientInterface {

    /**
     * The instantiated client from the @aws-sdk/client-cloudfront library.
     * @private
     */
    private client: AWSCloudFrontClient;

    /**
     * The client to use to interact with AWS CloudFront. It is a wrapper around the CloudFrontClient of @aws-sdk/client-cloudfront.
     * @param logHandler The log handler used to output logs.
     * @param region The aws region for which the client will be used.
     */
    constructor(
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
        @inject("%pristine.aws.region%") public region: string,
    ) {
    }

    /**
     * Returns the instantiated CloudFrontClient from the @aws-sdk/client-cloudfront
     */
    getClient(): AWSCloudFrontClient {
        return this.client = this.client ?? new AWSCloudFrontClient({region: this.region});
    }

    /**
     * Allows you to manually set the config if needed.
     * @param config
     */
    setClient(config: CloudFrontClientConfig) {
        this.client = new AWSCloudFrontClient(config);
    }

    /**
     * Invalidates all the provided paths.
     *
     * @param distributionId
     * @param paths
     */
    async invalidate(distributionId: string, paths: string[]): Promise<CreateInvalidationResult> {
        this.logHandler.debug("CloudFront CLIENT - Invalidating", {distributionId, paths}, AwsModuleKeyname);
        const command = new CreateInvalidationCommand({
            DistributionId: distributionId,
            InvalidationBatch: {
                Paths: {
                    Items: paths,
                    Quantity: paths.length,
                },
                CallerReference: uuidv4(),
            }
        })
        try {
            const response: CreateInvalidationResult = await this.getClient().send(command);

            if(response === undefined) {
                throw new Error("Unknown error invalidating the CloudFront distribution");
            }

            return response;
        } catch (e) {
            this.logHandler.error("Error invalidating cloudfront", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Returns the status of the invalidation
     *
     * @param distributionId
     * @param invalidationId
     */
    async getInvalidation(distributionId: string, invalidationId: string): Promise<GetInvalidationResult> {
        this.logHandler.debug("CloudFront CLIENT - Get Invalidating", {distributionId, invalidationId}, AwsModuleKeyname);
        const command = new GetInvalidationCommand({
            DistributionId: distributionId,
            Id: invalidationId,
        })

        try {
            const response: GetInvalidationResult = await this.getClient().send(command);

            if(response === undefined) {
                throw new Error("Unknown error invalidating the CloudFront distribution");
            }

            return response;
        } catch (e) {
            this.logHandler.error("Error getting invalidation from cloudfront", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }
}
