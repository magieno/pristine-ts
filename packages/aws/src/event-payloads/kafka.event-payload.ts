import {KafkaMessageModel} from "../models/kafka-message.model";

/**
 * The Pristine event payload type of a parsed Kafka event
 */
export class KafkaEventPayload {
    eventSource: string;
    eventSourceArn: string;
    topicName: string;
    messages: KafkaMessageModel[] = [];
}
