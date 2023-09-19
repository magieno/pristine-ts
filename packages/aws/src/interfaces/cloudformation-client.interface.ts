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

/**
 * The CloudformationClient Interface defines the methods that a Cloudformation client must implement.
 * When injecting the Cloudformation client the 'CloudformationClientInterface' tag should be used.
 */
export interface CloudformationClientInterface {
    /**
     * Returns the instantiated CloudformationClient from the @aws-sdk/client-s3 cloudformation
     */
    getClient(): AWSCloudformationClient;

    /**
     * Allows you to manually set the config if needed.
     * @param config
     */
    setClient(config: CloudFormationClientConfig);

    /**
     * Gets the description and all its details from a Cloudformation stack.
     * @param stackName The stack name to get the.
     */
    getStackDescription(stackName: string): Promise<Stack>;

    /**
     * Creates a new stack in Cloudformation.
     * @param input The input to create the new stack.
     */
    createStack(input: CreateStackCommandInput): Promise<CreateStackCommandOutput>;

    /**
     * Updates a stack in Cloudformation.
     * @param input The input to update the new stack.
     */
    updateStack(input: UpdateStackCommandInput): Promise<UpdateStackCommandOutput>;

    /**
     * Deletes a stack in Cloudformation.
     * @param input The input to delete the new stack.
     */
    deleteStack(input: DeleteStackCommandInput): Promise<DeleteStackCommandOutput>;
}