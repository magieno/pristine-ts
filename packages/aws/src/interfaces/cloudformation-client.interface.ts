import {CloudFormationClient as AWSCloudformationClient} from "@aws-sdk/client-cloudformation/dist-types/CloudFormationClient";
import {
  Capability,
  CreateChangeSetCommandInput,
  CreateChangeSetCommandOutput,
  CreateStackCommandInput,
  CreateStackCommandOutput,
  DeleteChangeSetCommandInput,
  DeleteChangeSetCommandOutput,
  DeleteStackCommandInput,
  DeleteStackCommandOutput,
  DescribeChangeSetCommandInput,
  DescribeChangeSetCommandOutput,
  ExecuteChangeSetCommandInput,
  ExecuteChangeSetCommandOutput,
  ListChangeSetsCommandInput,
  ListChangeSetsCommandOutput,
  Stack,
  UpdateStackCommandInput,
  UpdateStackCommandOutput,
} from "@aws-sdk/client-cloudformation";
import {CloudFormationClientConfig} from "@aws-sdk/client-cloudformation/dist-types/ts3.4";
import {CloudformationDeploymentStatusEnum} from "../enums/cloudformation-deployment-status.enum";
import {ClientOptionsInterface} from "./client-options.interface";

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
   * @param options
   */
  getStackDescription(stackName: string, options?: Partial<ClientOptionsInterface>): Promise<Stack | undefined>;

  /**
   * Gets the description and all its details from all the CloudFormation stacks.
   */
  listStacks(options?: Partial<ClientOptionsInterface>): Promise<Stack[]>;

  /**
   * Creates a new stack in Cloudformation.
   * @param input The input to create the new stack.
   * @param options
   */
  createStack(input: CreateStackCommandInput, options?: Partial<ClientOptionsInterface>): Promise<CreateStackCommandOutput>;

  /**
   * Updates a stack in Cloudformation.
   * @param input The input to update the new stack.
   * @param options
   */
  updateStack(input: UpdateStackCommandInput, options?: Partial<ClientOptionsInterface>): Promise<UpdateStackCommandOutput>;

  /**
   * Deletes a stack in Cloudformation.
   * @param input The input to delete the new stack.
   * @param options
   */
  deleteStack(input: DeleteStackCommandInput, options?: Partial<ClientOptionsInterface>): Promise<DeleteStackCommandOutput>;

  /**
   * Creates a Change Set.
   * @param input The input to create a change set.
   * @param options
   */
  createChangeSet(input: CreateChangeSetCommandInput, options?: Partial<ClientOptionsInterface>): Promise<CreateChangeSetCommandOutput>;

  /**
   * Deletes a Change Set.
   * @param input The input to delete a change set.
   * @param options
   */
  deleteChangeSet(input: DeleteChangeSetCommandInput, options?: Partial<ClientOptionsInterface>): Promise<DeleteChangeSetCommandOutput>;

  /**
   * Describes a Change Set.
   * @param input The input to describe a change set.
   * @param options
   */
  describeChangeSet(input: DescribeChangeSetCommandInput, options?: Partial<ClientOptionsInterface>): Promise<DescribeChangeSetCommandOutput>;

  /**
   * Executes a Change Set.
   * @param input The input to execute a change set.
   * @param options
   */
  executeChangeSet(input: ExecuteChangeSetCommandInput, options?: Partial<ClientOptionsInterface>): Promise<ExecuteChangeSetCommandOutput>;

  /**
   * Lists a Change Set.
   * @param input The input to list a change set.
   * @param options
   */
  listChangeSets(input: ListChangeSetsCommandInput, options?: Partial<ClientOptionsInterface>): Promise<ListChangeSetsCommandOutput>;

  /**
   * This method encapsulates the deployment of a Stack, whether the Stack already exists or not. It uses ChangeSets to do so.
   * It monitors the status of the stack and returns the status when the status is a final state.
   * @param stackName
   * @param cloudformationTemplateS3Url
   * @param stackParameters
   * @param capabilities
   * @param statusCallback
   * @param options
   */
  deployStack(stackName: string, cloudformationTemplateS3Url: string, stackParameters: { [key in string]: string }, capabilities: Capability[], statusCallback?: (status: CloudformationDeploymentStatusEnum, changeSetName?: string) => void, options?: Partial<ClientOptionsInterface>): Promise<CloudformationDeploymentStatusEnum>;
}
