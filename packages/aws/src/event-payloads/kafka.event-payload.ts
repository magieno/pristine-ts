import {KafkaMessageModel} from "../models/kafka-message.model";

export class KafkaEventPayload {
    eventSource: string;
    eventSourceArn: string;
    topicName: string;
    messages: KafkaMessageModel[] = [];
}
