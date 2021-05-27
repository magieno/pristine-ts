import {KafkaTopicModel} from "../models/kafka-topic.model";

export class KafkaEventPayload {
    eventSource: string;
    eventSourceArn: string;
    topics: KafkaTopicModel[];
}
