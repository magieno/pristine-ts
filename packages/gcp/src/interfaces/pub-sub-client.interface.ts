import {PubSub} from "@google-cloud/pubsub";
import {PubSubMessageModel} from "../models/pub-sub-message.model";
import {PubSubMessageSentConfirmationModel} from "../models/pub-sub-message-sent-confirmation.model";
import {GcpClientOptionsInterface} from "./client-options.interface";

export interface PubSubClientInterface {
  getClient(): PubSub;

  publish(topic: string, message: PubSubMessageModel, options?: Partial<GcpClientOptionsInterface>): Promise<PubSubMessageSentConfirmationModel>;
}
