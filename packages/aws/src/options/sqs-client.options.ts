import {ClientOptionsInterface} from "../interfaces/client-options.interface";
import {SQSClient, SQSClientConfig} from "@aws-sdk/client-sqs";

export class SqsClientOptions {
  /**
   * The id of the Event this operation was triggered BY. Used for logging purposes.
   * WARNING: It will NOT be added to the MessageAttributes.
   */
  eventId?: string;

  /**
   * Event Group Id that groups all the events in a similar operation. Will be added to MessageAttributes.
   */
  eventGroupId?: string;

  /**
   * The message group id for FIFO queues.
   */
  messageGroupId?: string;

  /**
   * The length of time, in seconds, for which to delay a specific message.
   */
  delaySeconds?: number;

  /**
   * The unique id used by Amazon SQS in Fifo queues to avoid treating a message twice.
   */
  messageDeduplicationId?: string;

  /**
   * Client Options
   */
  clientOptions?: Partial<ClientOptionsInterface>;

  /**
   * The configs for which the SQS client is created, that can be overriden.
   */
  clientConfigs?: Partial<SQSClientConfig>;
}