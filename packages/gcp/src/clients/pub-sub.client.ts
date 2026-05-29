import {inject, injectable} from "tsyringe";
import {injectConfig, moduleScoped, tag, traced} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {PubSub} from "@google-cloud/pubsub";
import {GcpModuleKeyname} from "../gcp.module.keyname";
import {GcpConfigurationKeys} from "../gcp.configuration-keys";
import {PubSubClientInterface} from "../interfaces/pub-sub-client.interface";
import {PubSubMessageModel} from "../models/pub-sub-message.model";
import {PubSubMessageSentConfirmationModel} from "../models/pub-sub-message-sent-confirmation.model";
import {PubSubPublishError} from "../errors/pub-sub-publish.error";
import {GcpClientOptionsInterface} from "../interfaces/client-options.interface";

/**
 * Client for Google Cloud Pub/Sub. Mirrors `SqsClient` (publish-side) and the topic
 * half of EventBridge in `@pristine-ts/aws`.
 */
@tag("PubSubClientInterface")
@moduleScoped(GcpModuleKeyname)
@injectable()
export class PubSubClient implements PubSubClientInterface {
  private client?: PubSub;

  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    @injectConfig(GcpConfigurationKeys.ProjectId) private readonly projectId: string,
  ) {
  }

  getClient(): PubSub {
    return this.client = this.client ?? new PubSub({projectId: this.projectId});
  }

  /**
   * Publishes a single message to a topic. `topic` accepts either a bare topic name
   * (e.g. `"my-topic"`) or a fully-qualified resource name
   * (`"projects/my-proj/topics/my-topic"`).
   */
  @traced()
  async publish(
    topic: string,
    message: PubSubMessageModel,
    options?: Partial<GcpClientOptionsInterface>,
  ): Promise<PubSubMessageSentConfirmationModel> {
    this.logHandler.debug("PubSubClient: Publishing message.", {
      extra: {topic, attributes: message.attributes, orderingKey: message.orderingKey},
      eventId: options?.eventId,
      eventGroupId: options?.eventGroupId,
    });
    try {
      const data = typeof message.data === "string" ? Buffer.from(message.data) : message.data;
      const messageId = await this.getClient().topic(topic).publishMessage({
        data,
        attributes: message.attributes,
        orderingKey: message.orderingKey,
      });
      this.logHandler.debug("PubSubClient: Message published.", {
        extra: {topic, messageId},
        eventId: options?.eventId,
        eventGroupId: options?.eventGroupId,
      });
      return {messageId};
    } catch (error) {
      this.logHandler.error("PubSubClient: Failed to publish message.", {
        extra: {error, topic, attributes: message.attributes},
        eventId: options?.eventId,
        eventGroupId: options?.eventGroupId,
      });
      throw new PubSubPublishError(error, topic, message.attributes);
    }
  }
}
