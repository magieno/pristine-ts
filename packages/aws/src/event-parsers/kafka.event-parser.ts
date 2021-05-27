import {Event, EventParserInterface} from "@pristine-ts/event";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {KafkaEventPayload} from "../event-payloads/kafka.event-payload";
import {KafkaEventType} from "../enums/kafka-event-type.enum";
import {KafkaTopicModel} from "../models/kafka-topic.model";
import {KafkaTopicRecordModel} from "../models/kafka-topic-record.model";

@tag(ServiceDefinitionTagEnum.EventParser)
@injectable()
export class KafkaEventParser implements EventParserInterface<KafkaEventPayload>{

    parse(rawEvent: any): Event<KafkaEventPayload> {
        const event = new Event<KafkaEventPayload>();
        event.type = KafkaEventType.KafkaEvent;
        event.payload = new KafkaEventPayload();

        event.payload.eventSource = rawEvent.eventSource;
        event.payload.eventSourceArn = rawEvent.eventSourceArn;

        for(const key in rawEvent.records) {
            if (rawEvent.records.hasOwnProperty(key)) {
                const topic = new KafkaTopicModel();
                for(const topicRecord of rawEvent.records[key]){
                    const record = new KafkaTopicRecordModel();
                    record.offset = topicRecord.offset;
                    record.partition = topicRecord.partition;
                    record.timestamp = new Date(topicRecord.timestamp);
                    record.timestampType = topicRecord.timestampType;
                    record.topicName = topicRecord.topicName;
                    record.value = new Buffer(topicRecord.value, 'base64').toString('ascii');
                    topic.records.push(record);
                }
                event.payload.topics.push(topic);
            }
        }
        return event;
    }

    supports(event: any): boolean {
        return event.hasOwnProperty("eventSource") &&
            event.eventSource === "aws:kafka"
    }

}
