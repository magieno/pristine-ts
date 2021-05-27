import {KafkaTopicModel} from "../models/kafka-topic.model";

export class KafkaEventPayload {
    eventSource: string;
    eventSourceArn: string;
    awsRegion: string;
    topics: KafkaTopicModel[];
}
