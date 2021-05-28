
export class KafkaMessageModel {
    partition: number;
    offset: number;
    timestamp: Date;
    timestampType: string;
    value: any;
}
