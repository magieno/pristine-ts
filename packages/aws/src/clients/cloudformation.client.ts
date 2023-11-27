import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {moduleScoped, tag} from "@pristine-ts/common";
import {AwsModuleKeyname} from "../aws.module.keyname";
import {
    Capability,
    CloudFormationClient as AWSCloudformationClient,
    CloudFormationClientConfig,
    CreateChangeSetCommand,
    CreateChangeSetCommandInput,
    CreateChangeSetCommandOutput,
    CreateStackCommand,
    CreateStackCommandInput,
    CreateStackCommandOutput,
    DeleteChangeSetCommand,
    DeleteChangeSetCommandInput,
    DeleteChangeSetCommandOutput,
    DeleteStackCommand,
    DeleteStackCommandInput,
    DeleteStackCommandOutput,
    DescribeChangeSetCommand,
    DescribeChangeSetCommandInput,
    DescribeChangeSetCommandOutput,
    DescribeStacksCommand,
    DescribeStacksCommandOutput,
    ExecuteChangeSetCommand,
    ExecuteChangeSetCommandInput,
    ExecuteChangeSetCommandOutput,
    ListChangeSetsCommand,
    ListChangeSetsCommandInput,
    ListChangeSetsCommandOutput,
    Parameter,
    Stack,
    UpdateStackCommand,
    UpdateStackCommandInput,
    UpdateStackCommandOutput,
    ChangeSetType
} from "@aws-sdk/client-cloudformation";
import {CloudformationClientInterface} from "../interfaces/cloudformation-client.interface";
import {v4 as uuid} from "uuid";
import {CloudformationDeploymentStatusEnum} from "../enums/cloudformation-deployment-status.enum";

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
    async getStackDescription(stackName: string): Promise<Stack | undefined> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Getting stack information", {stackName}, AwsModuleKeyname);
        const command = new DescribeStacksCommand({
            StackName: stackName,
        })
        try {
            const response: DescribeStacksCommandOutput = await this.getClient().send(command);
            if(!response.Stacks || response.Stacks.length < 1){
                return undefined;
            }
            if(response.Stacks.length > 1){
               this.logHandler.warning("More than one stack was returned from cloudformation");
            }
            return response.Stacks[0];
        } catch (e) {
            this.logHandler.error("Error getting stack description from cloudformation", {error: e}, AwsModuleKeyname);
            if (e.message.match("(.*)" + stackName + "(.*)does not exist(.*)")) {
                return undefined;
            } else {
                throw e;
            }
            throw e;
        }
    }

    /**
     * Gets the description and all its details from all the CloudFormation stacks.
     */
    async listStacks(): Promise<Stack[]> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Getting list of stacks", {}, AwsModuleKeyname);
        const command = new DescribeStacksCommand({})
        try {
            const response: DescribeStacksCommandOutput = await this.getClient().send(command);
            return response.Stacks ?? [];
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
            return await this.getClient().send(command);
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
            return await this.getClient().send(command);
        } catch (e) {
            if(e.message == "No updates are to be performed.") {
                return {
                    $metadata: {
                        httpStatusCode: 200,
                    }
                }
            }
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
            return await this.getClient().send(command);
        } catch (e) {
            this.logHandler.error("Error deleting stack in cloudformation", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Creates a Change Set.
     * @param input The input to create a change set.
     */
    async createChangeSet(input: CreateChangeSetCommandInput): Promise<CreateChangeSetCommandOutput> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Create Change Set", {input}, AwsModuleKeyname);
        const command = new CreateChangeSetCommand(input)
        try {
            return await this.getClient().send(command);
        } catch (e) {
            this.logHandler.error("Error creating change set in cloudformation", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Deletes a Change Set.
     * @param input The input to delete a change set.
     */
    async deleteChangeSet(input: DeleteChangeSetCommandInput): Promise<DeleteChangeSetCommandOutput> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - delete Change Set", {input}, AwsModuleKeyname);
        const command = new DeleteChangeSetCommand(input)
        try {
            return await this.getClient().send(command);
        } catch (e) {
            this.logHandler.error("Error deleting change set in cloudformation", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Describes a Change Set.
     * @param input The input to describe a change set.
     */
    async describeChangeSet(input: DescribeChangeSetCommandInput): Promise<DescribeChangeSetCommandOutput> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Describe Change Set", {input}, AwsModuleKeyname);
        const command = new DescribeChangeSetCommand(input)
        try {
            return await this.getClient().send(command);
        } catch (e) {
            this.logHandler.error("Error describing change set in cloudformation", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Executes a Change Set.
     * @param input The input to execute a change set.
     */
    async executeChangeSet(input: ExecuteChangeSetCommandInput): Promise<ExecuteChangeSetCommandOutput> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Execute Change Set", {input}, AwsModuleKeyname);
        const command = new ExecuteChangeSetCommand(input)
        try {
            return await this.getClient().send(command);
        } catch (e) {
            this.logHandler.error("Error executing change set in cloudformation", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Lists a Change Set.
     * @param input The input to list a change set.
     */
    async listChangeSets(input: ListChangeSetsCommandInput): Promise<ListChangeSetsCommandOutput> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - List Change Sets", {input}, AwsModuleKeyname);
        const command = new ListChangeSetsCommand(input)
        try {
            return await this.getClient().send(command);
        } catch (e) {
            this.logHandler.error("Error listing change sets in cloudformation", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * This method encapsulates the deployment of a Stack, whether the Stack already exists or not. It uses ChangeSets to do so.
     * It monitors the status of the stack and returns the status when the status is a final state.
     * @param stackName
     * @param cloudformationTemplateS3Url
     * @param stackParameters
     * @param capabilities
     * @param statusCallback
     */
    async deployStack(stackName: string, cloudformationTemplateS3Url: string, stackParameters: {[key in string]:string}, capabilities: Capability[], statusCallback?: (status: CloudformationDeploymentStatusEnum, changeSetName: string) => void): Promise<CloudformationDeploymentStatusEnum> {
        const parameters: Parameter[] = [];

        for(const key in stackParameters) {
            if(stackParameters.hasOwnProperty(key) === false) {
                continue;
            }
            parameters.push({
                ParameterKey: key,
                ParameterValue: stackParameters[key],
            });
        }

        const changeSetName = `p-${uuid()}`;

        // Check if the stack exists or not first.
        let changeSetType: ChangeSetType = ChangeSetType.UPDATE;

        const stack = await this.getStackDescription(stackName);

        if(stack === undefined) {
            changeSetType = ChangeSetType.CREATE;
        }

        await this.createChangeSet(
            {
                StackName: stackName,
                TemplateURL: cloudformationTemplateS3Url,
                Parameters: parameters,
                Capabilities: capabilities,
                ChangeSetName: changeSetName,
                ChangeSetType: changeSetType,
            }
        );

        // Check if there are actual changes in the ChangeSet.
        await this.describeChangeSet({
            StackName: stackName,
            ChangeSetName: changeSetName,
        })

        const status = await this.monitorStack(stackName, changeSetName);

        switch (status) {
            case CloudformationDeploymentStatusEnum.Failed:
            case CloudformationDeploymentStatusEnum.NoChangesToPerform:
                return status;
            case CloudformationDeploymentStatusEnum.InProgress:
                this.logHandler.error("The returned status of 'monitorStack' should never be 'InProgress'.", {}, AwsModuleKeyname)
            default:
                break;
        }

        // Execute the changes and start monitoring
        await this.executeChangeSet({
            StackName: stackName,
            ChangeSetName: changeSetName,
        })

        return this.monitorStack(stackName, changeSetName, statusCallback);
    }

    private async monitorStack(stackName: string, changeSetName: string, statusCallback?: (status: CloudformationDeploymentStatusEnum, changeSetName: string) => void): Promise<CloudformationDeploymentStatusEnum> {
        while(true) {
            const response = await this.describeChangeSet({
                StackName: stackName,
                ChangeSetName: changeSetName,
            });

            const status = response.Status;

            if(status === undefined) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                continue;
            }

            switch (response.Status) {
                case "CREATE_IN_PROGRESS":
                case "CREATE_PENDING":
                case "DELETE_IN_PROGRESS":
                case "DELETE_PENDING":
                    if(statusCallback) {
                        statusCallback(CloudformationDeploymentStatusEnum.InProgress, changeSetName);
                    } response.ExecutionStatus
                    continue;

                case "CREATE_COMPLETE":
                case "DELETE_COMPLETE":
                    return CloudformationDeploymentStatusEnum.Completed;
                case "DELETE_FAILED":
                case "FAILED":
                    return CloudformationDeploymentStatusEnum.Failed;
            }

            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}
