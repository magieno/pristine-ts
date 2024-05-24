import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {moduleScoped, tag} from "@pristine-ts/common";
import {AwsModuleKeyname} from "../aws.module.keyname";
import {
    Capability,
    ChangeSetStatus,
    ChangeSetType,
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
    OnStackFailure,
    Parameter,
    Stack,
    StackStatus,
    UpdateStackCommand,
    UpdateStackCommandInput,
    UpdateStackCommandOutput,
} from "@aws-sdk/client-cloudformation";
import {CloudformationClientInterface} from "../interfaces/cloudformation-client.interface";
import {v4 as uuid} from "uuid";
import {CloudformationDeploymentStatusEnum} from "../enums/cloudformation-deployment-status.enum";
import {NotFoundHttpError} from "@pristine-ts/networking";
import {ClientOptionsInterface} from "../interfaces/client-options.interface";

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
     * @param stackName The stack name to retrieve the description of.
     * @param options
     */
    async getStackDescription(stackName: string, options?: Partial<ClientOptionsInterface>): Promise<Stack | undefined> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Getting stack information", {stackName}, AwsModuleKeyname);
        const command = new DescribeStacksCommand({
            StackName: stackName,
        })
        try {
            const response: DescribeStacksCommandOutput = await this.getClient().send(command, {
                requestTimeout: options?.requestTimeout,
            });
            if (!response.Stacks || response.Stacks.length < 1) {
                return undefined;
            }
            if (response.Stacks.length > 1) {
                this.logHandler.warning("More than one stack was returned from cloudformation");
            }
            return response.Stacks[0];
        } catch (e) {
            this.logHandler.error("Error getting stack description from cloudformation", {error: e, stackName}, AwsModuleKeyname);
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
    async listStacks(options?: Partial<ClientOptionsInterface>): Promise<Stack[]> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Getting list of stacks", {}, AwsModuleKeyname);
        const command = new DescribeStacksCommand({})
        try {
            const response: DescribeStacksCommandOutput = await this.getClient().send(command, options);
            return response.Stacks ?? [];
        } catch (e) {
            this.logHandler.error("Error getting stack description from cloudformation", {error: e}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Creates a new stack in Cloudformation.
     * @param input The input to create the new stack.
     * @param options
     */
    async createStack(input: CreateStackCommandInput, options?: Partial<ClientOptionsInterface>): Promise<CreateStackCommandOutput> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Creating new stack", {input}, AwsModuleKeyname);
        const command = new CreateStackCommand(input)
        try {
            return await this.getClient().send(command, options);
        } catch (e) {
            this.logHandler.error("Error creating stack in cloudformation", {error: e, input}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Updates a stack in Cloudformation.
     * @param input The input to update the new stack.
     * @param options
     */
    async updateStack(input: UpdateStackCommandInput, options?: Partial<ClientOptionsInterface>): Promise<UpdateStackCommandOutput> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Updating stack", {input}, AwsModuleKeyname);
        const command = new UpdateStackCommand(input)
        try {
            return await this.getClient().send(command, options);
        } catch (e) {
            if (e.message == "No updates are to be performed.") {
                return {
                    $metadata: {
                        httpStatusCode: 200,
                    }
                }
            }
            this.logHandler.error("Error updating stack in cloudformation", {error: e, input}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Deletes a stack in Cloudformation.
     * @param input The input to delete the new stack.
     * @param options
     */
    async deleteStack(input: DeleteStackCommandInput, options?: Partial<ClientOptionsInterface>): Promise<DeleteStackCommandOutput> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Deleting stack", {input}, AwsModuleKeyname);
        const command = new DeleteStackCommand(input)
        try {
            return await this.getClient().send(command, options);
        } catch (e) {
            this.logHandler.error("Error deleting stack in cloudformation", {error: e, input}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Creates a Change Set.
     * @param input The input to create a change set.
     * @param options
     */
    async createChangeSet(input: CreateChangeSetCommandInput, options?: Partial<ClientOptionsInterface>): Promise<CreateChangeSetCommandOutput> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Create Change Set", {input}, AwsModuleKeyname);
        const command = new CreateChangeSetCommand(input)
        try {
            const response = await this.getClient().send(command, options);

            this.logHandler.debug("CLOUDFORMATION CLIENT - Create Change set Response", {input, response}, AwsModuleKeyname)

            return response;
        } catch (e) {
            this.logHandler.error("Error creating change set in cloudformation", {error: e, input}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Deletes a Change Set.
     * @param input The input to delete a change set.
     * @param options
     */
    async deleteChangeSet(input: DeleteChangeSetCommandInput, options?: Partial<ClientOptionsInterface>): Promise<DeleteChangeSetCommandOutput> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Delete Change Set", {input}, AwsModuleKeyname);
        const command = new DeleteChangeSetCommand(input)
        try {
            const response = await this.getClient().send(command, options);

            this.logHandler.debug("CLOUDFORMATION CLIENT - Delete Change set Response", {input, response}, AwsModuleKeyname)

            return response;
        } catch (e) {
            this.logHandler.error("Error deleting change set in cloudformation", {error: e, input}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Describes a Change Set.
     * @param input The input to describe a change set.
     * @param options
     */
    async describeChangeSet(input: DescribeChangeSetCommandInput, options?: Partial<ClientOptionsInterface>): Promise<DescribeChangeSetCommandOutput> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Describe Change Set", {input}, AwsModuleKeyname);
        const command = new DescribeChangeSetCommand(input)
        try {

            const response = await this.getClient().send(command, options);

            this.logHandler.debug("CLOUDFORMATION CLIENT - Describe Change set Response", {input, response}, AwsModuleKeyname)

            return response;
        } catch (e) {
            this.logHandler.error("Error describing change set in cloudformation", {error: e, input}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Executes a Change Set.
     * @param input The input to execute a change set.
     * @param options
     */
    async executeChangeSet(input: ExecuteChangeSetCommandInput, options?: Partial<ClientOptionsInterface>): Promise<ExecuteChangeSetCommandOutput> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - Execute Change Set", {input}, AwsModuleKeyname);
        const command = new ExecuteChangeSetCommand(input)
        try {
            const response = await this.getClient().send(command, options);

            this.logHandler.debug("CLOUDFORMATION CLIENT - Execute Change set Response", {input, response}, AwsModuleKeyname)

            return response;
        } catch (e) {
            this.logHandler.error("Error executing change set in cloudformation", {error: e, input}, AwsModuleKeyname);
            throw e;
        }
    }

    /**
     * Lists a Change Set.
     * @param input The input to list a change set.
     * @param options
     */
    async listChangeSets(input: ListChangeSetsCommandInput, options?: Partial<ClientOptionsInterface>): Promise<ListChangeSetsCommandOutput> {
        this.logHandler.debug("CLOUDFORMATION CLIENT - List Change Sets", {input}, AwsModuleKeyname);
        const command = new ListChangeSetsCommand(input)
        try {
            const response = await this.getClient().send(command, options);

            this.logHandler.debug("CLOUDFORMATION CLIENT - List Change set Response", {input, response}, AwsModuleKeyname)

            return response;
        } catch (e) {
            this.logHandler.error("Error listing change sets in cloudformation", {error: e, input}, AwsModuleKeyname);
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
    async deployStack(stackName: string, cloudformationTemplateS3Url: string, stackParameters: { [key in string]: string }, capabilities: Capability[], statusCallback?: (status: CloudformationDeploymentStatusEnum, changeSetName?: string) => void, options?: Partial<ClientOptionsInterface>): Promise<CloudformationDeploymentStatusEnum> {
        const parameters: Parameter[] = [];

        for (const key in stackParameters) {
            if (stackParameters.hasOwnProperty(key) === false) {
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

        const stack = await this.getStackDescription(stackName, options);

        if (stack === undefined) {
            changeSetType = ChangeSetType.CREATE;
        }

        const response = await this.createChangeSet(
            {
                StackName: stackName,
                TemplateURL: cloudformationTemplateS3Url,
                Parameters: parameters,
                Capabilities: capabilities,
                ChangeSetName: changeSetName,
                ChangeSetType: changeSetType,
                OnStackFailure: OnStackFailure.ROLLBACK,
            }, options
        );

        this.logHandler.debug("After calling createChangeSet", {stack, response, changeSetName, stackName}, AwsModuleKeyname)

        const status = await this.monitorChangeSet(stackName, changeSetName, undefined, options);

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
        }, options)

        return this.monitorStack(stackName, statusCallback, options);
    }

    private async monitorChangeSet(stackName: string, changeSetName: string, statusCallback?: (status: CloudformationDeploymentStatusEnum, changeSetName: string) => void, options?: Partial<ClientOptionsInterface>): Promise<CloudformationDeploymentStatusEnum> {
        while (true) {
            const response = await this.describeChangeSet({
                StackName: stackName,
                ChangeSetName: changeSetName,
            }, options);

            this.logHandler.debug("Describe ChangeSet result.", {response}, AwsModuleKeyname)

            const status = response.Status;

            if (status === undefined) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                continue;
            }

            switch (status) {
                case ChangeSetStatus.CREATE_IN_PROGRESS:
                case ChangeSetStatus.CREATE_PENDING:
                case ChangeSetStatus.DELETE_IN_PROGRESS:
                case ChangeSetStatus.DELETE_PENDING:
                    if (statusCallback) {
                        statusCallback(CloudformationDeploymentStatusEnum.InProgress, changeSetName);
                    }
                    break;

                case ChangeSetStatus.CREATE_COMPLETE:
                case ChangeSetStatus.DELETE_COMPLETE:
                    return CloudformationDeploymentStatusEnum.Completed;

                case ChangeSetStatus.FAILED:
                    switch(response.StatusReason) {
                        case "No updates are to be performed.":
                        case"The submitted information didn't contain changes. Submit different information to create a change set.":
                            return CloudformationDeploymentStatusEnum.NoChangesToPerform;
                        default:
                            return CloudformationDeploymentStatusEnum.Failed;
                    }
                case ChangeSetStatus.DELETE_FAILED:
                    this.logHandler.error("Error with the ChangeSet.", {response}, AwsModuleKeyname)
                    return CloudformationDeploymentStatusEnum.Failed;
            }

            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    private async monitorStack(stackName: string, statusCallback?: (status: CloudformationDeploymentStatusEnum) => void, options?: Partial<ClientOptionsInterface>): Promise<CloudformationDeploymentStatusEnum> {
        while (true) {
            const response = await this.getStackDescription(stackName, options);

            this.logHandler.debug("Stack Description result.", {response}, AwsModuleKeyname)

            if(response === undefined) {
                const message = `Stack '${stackName}' wasn't found.`;

                this.logHandler.error(message, {stackName, response})
                throw new NotFoundHttpError(message);
            }

            const status = response.StackStatus;

            if (status === undefined) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                continue;
            }

            switch (status) {
                // In progress states
                case StackStatus.CREATE_IN_PROGRESS:
                case StackStatus.DELETE_IN_PROGRESS:
                case StackStatus.IMPORT_IN_PROGRESS:
                case StackStatus.UPDATE_COMPLETE_CLEANUP_IN_PROGRESS:
                case StackStatus.UPDATE_IN_PROGRESS:
                case StackStatus.REVIEW_IN_PROGRESS:
                    if (statusCallback) {
                        statusCallback(CloudformationDeploymentStatusEnum.InProgress);
                    }
                    break

                // Failure states
                case StackStatus.IMPORT_ROLLBACK_IN_PROGRESS: // A rollback means that it will eventually fail. Let's fail now instead.
                case StackStatus.UPDATE_ROLLBACK_IN_PROGRESS: // A rollback means that it will eventually fail. Let's fail now instead.
                case StackStatus.ROLLBACK_IN_PROGRESS: // A rollback means that it will eventually fail. Let's fail now instead.
                case StackStatus.CREATE_FAILED:
                case StackStatus.DELETE_COMPLETE:
                case StackStatus.DELETE_FAILED:
                case StackStatus.IMPORT_ROLLBACK_COMPLETE:
                case StackStatus.IMPORT_ROLLBACK_FAILED:
                case StackStatus.ROLLBACK_COMPLETE:
                case StackStatus.ROLLBACK_FAILED:
                case StackStatus.UPDATE_FAILED:

                case StackStatus.UPDATE_ROLLBACK_COMPLETE:
                case StackStatus.UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS:
                case StackStatus.UPDATE_ROLLBACK_FAILED:
                    this.logHandler.error(`Invalid status '${status}' for stack '${stackName}'.`, {response, stackName});
                    return CloudformationDeploymentStatusEnum.Failed;

                // Success states
                case StackStatus.CREATE_COMPLETE:
                case StackStatus.IMPORT_COMPLETE:
                case StackStatus.UPDATE_COMPLETE:
                    return CloudformationDeploymentStatusEnum.Completed;
            }

            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}
