/**
 * Model representing the Kafka message of the Kafka event.
 */
export class KafkaMessageModel {
  partition: number;
  offset: number;
  timestamp: Date;
  timestampType: string;
  value: any;
}
