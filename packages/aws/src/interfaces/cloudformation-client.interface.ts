import {S3PresignedOperationTypeEnum} from "../enums/s3-presigned-operation-type.enum";
import {GetObjectCommandOutput, S3Client as AWSS3Client, S3ClientConfig} from "@aws-sdk/client-s3";
import {
    CloudFormationClient as AWSCloudformationClient
} from "@aws-sdk/client-cloudformation/dist-types/CloudFormationClient";
import {
    CreateStackCommandInput,
    CreateStackCommandOutput,
    DeleteStackCommandInput, DeleteStackCommandOutput,
    Stack, UpdateStackCommandInput, UpdateStackCommandOutput,
    CreateChangeSetCommand,
    CreateChangeSetCommandInput,
    CreateChangeSetCommandOutput,
    DeleteChangeSetCommand,
    DeleteChangeSetCommandInput,
    DeleteChangeSetCommandOutput,
    DescribeChangeSetCommand,
    DescribeChangeSetCommandInput,
    DescribeChangeSetCommandOutput,
    ExecuteChangeSetCommand,
    ExecuteChangeSetCommandInput,
    ExecuteChangeSetCommandOutput,
    ListChangeSetsCommand,
    ListChangeSetsCommandInput,
    ListChangeSetsCommandOutput,
    DescribeStacksCommand,
    DescribeStacksCommandOutput,
    StackStatus, Capability, ChangeSetStatus,
} from "@aws-sdk/client-cloudformation";
import {CloudFormationClientConfig} from "@aws-sdk/client-cloudformation/dist-types/ts3.4";
import {AwsModuleKeyname} from "../aws.module.keyname";

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
    getStackDescription(stackName: string): Promise<Stack | undefined>;

    /**
     * Gets the description and all its details from all the CloudFormation stacks.
     */
    listStacks(): Promise<Stack[]>;

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

    /**
     * Creates a Change Set.
     * @param input The input to create a change set.
     */
    createChangeSet(input: CreateChangeSetCommandInput): Promise<CreateChangeSetCommandOutput>;

    /**
     * Deletes a Change Set.
     * @param input The input to delete a change set.
     */
    deleteChangeSet(input: DeleteChangeSetCommandInput): Promise<DeleteChangeSetCommandOutput>;

    /**
     * Describes a Change Set.
     * @param input The input to describe a change set.
     */
    describeChangeSet(input: DescribeChangeSetCommandInput): Promise<DescribeChangeSetCommandOutput>;

    /**
     * Executes a Change Set.
     * @param input The input to execute a change set.
     */
    executeChangeSet(input: ExecuteChangeSetCommandInput): Promise<ExecuteChangeSetCommandOutput>;

    /**
     * Lists a Change Set.
     * @param input The input to list a change set.
     */
    listChangeSets(input: ListChangeSetsCommandInput): Promise<ListChangeSetsCommandOutput>;

    /**
     * This method encapsulates the deployment of a Stack, whether the Stack already exists or not. It uses ChangeSets to do so.
     * It monitors the status of the stack and returns the status when the status is a final state.
     * @param stackName
     * @param cloudformationTemplateS3Url
     * @param stackParameters
     * @param capabilities
     * @param statusCallback
     */
    deployStack(stackName: string, cloudformationTemplateS3Url: string, stackParameters: {[key in string]:string}, capabilities: Capability[], statusCallback?: (status: ChangeSetStatus, changeSetName: string) => void): Promise<ChangeSetStatus | "NO_CHANGES_TO_PERFORM">;
}
