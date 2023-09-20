import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {moduleScoped, tag} from "@pristine-ts/common";
import {AwsModuleKeyname} from "../aws.module.keyname";
import {
    CloudFormationClient as AWSCloudformationClient,
    CloudFormationClientConfig,
    CreateStackCommand,
    CreateStackCommandInput,
    CreateStackCommandOutput, DeleteStackCommand, DeleteStackCommandInput, DeleteStackCommandOutput,
    DescribeStacksCommand,
    DescribeStacksCommandOutput,
    Stack, UpdateStackCommand, UpdateStackCommandInput, UpdateStackCommandOutput
} from "@aws-sdk/client-cloudformation";
import {CloudformationClientInterface} from "../interfaces/cloudformation-client.interface";

/**
 * The client to use to interact with AWS Cloudformation. It is a wrapper around the CloudformationClient of @aws-sdk/client-cloudformation.
 * It is tagged so it can be injected using CloudformationClientInterface.
 * AWS documentation https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/cloudformation/
 */
@tag("CloudformationClientInterface")
@moduleScoped(AwsModuleKeyname)
@injectable()
export class CloudformationClient implements CloudformationClientInterface {

    /**
     * The instantiated client from the @aws-sdk/client-cloudformation library.
     * @private
     */
    private client: AWSCloudformationClient;

    /**
     * The client to use to interact with AWS Cloudformation. It is a wrapper around the CloudformationClient of @aws-sdk/client-cloudformation.
     * @param logHandler The log handler used to output logs.
     * @param region The aws region for which the client will be used.
     */
    constructor(
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
        @inject("%pristine.aws.region%") public region: string,
    ) {
    }

    /**
     * Returns the instantiated CloudformationClient from the @aws-sdk/client-s3 cloudformation
     */
    getClient(): AWSCloudformationClient {
        return this.client = this.client ?? new AWSCloudformationClient({region: this.region});
    }

    /**
     * Allows you to manually set the config if needed.
     * @param config
     */
    setClient(config: CloudFormationClientConfig) {
        this.client = new AWSCloudformationClient(config);
    }

    /**
     * Gets the description and all its details from a Cloudformation stack.
     * @param stackName The stack name to get the.
     */
    async getStackDescription(stackName: string): Promise<Stack> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Getting stack information", {stackName}, AwsModuleKeyname);
        const command = new DescribeStacksCommand({
            StackName: stackName,
        })
        try {
            const response: DescribeStacksCommandOutput = await this.getClient().send(command);
            if(!response.Stacks || response.Stacks.length < 1){
                throw new Error("No stacks were returned from cloudformation");
            }
            if(response.Stacks.length > 1){
                throw new Error("More than one stack was returned from cloudformation");
            }
            return response.Stacks[0];
        } catch (e) {
            this.logHandler.error("Error getting stack description from cloudformation", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Creates a new stack in Cloudformation.
     * @param input The input to create the new stack.
     */
    async createStack(input: CreateStackCommandInput): Promise<CreateStackCommandOutput> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Creating new stack", {input}, AwsModuleKeyname);
        const command = new CreateStackCommand(input)
        try {
            return this.getClient().send(command);
        } catch (e) {
            this.logHandler.error("Error creating stack in cloudformation", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Updates a stack in Cloudformation.
     * @param input The input to update the new stack.
     */
    async updateStack(input: UpdateStackCommandInput): Promise<UpdateStackCommandOutput> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Updating stack", {input}, AwsModuleKeyname);
        const command = new UpdateStackCommand(input)
        try {
            return this.getClient().send(command);
        } catch (e) {
            this.logHandler.error("Error updating stack in cloudformation", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Deletes a stack in Cloudformation.
     * @param input The input to delete the new stack.
     */
    async deleteStack(input: DeleteStackCommandInput): Promise<DeleteStackCommandOutput> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Deleting stack", {input}, AwsModuleKeyname);
        const command = new DeleteStackCommand(input)
        try {
            return this.getClient().send(command);
        } catch (e) {
            this.logHandler.error("Error deleting stack in cloudformation", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }
}
