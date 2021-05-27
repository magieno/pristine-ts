export class KafkaTopicRecordModel {
    topicName: string;
    partition: number;
    offset: number;
    timestamp: Date;
    timestampType: string;
    value: any;
}
