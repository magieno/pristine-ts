import {Event, EventParserInterface} from "@pristine-ts/event";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {KafkaEventPayload} from "../event-payloads/kafka.event-payload";
import {KafkaEventType} from "../enums/kafka-event-type.enum";
import {KafkaMessageModel} from "../models/kafka-message.model";

@tag(ServiceDefinitionTagEnum.EventParser)
@injectable()
export class KafkaEventParser implements EventParserInterface<KafkaEventPayload>{

    parse(rawEvent: any): Event<KafkaEventPayload>[] {
        const parsedEvents: Event<KafkaEventPayload>[] = [];

        for(const key in rawEvent.records) {
            const event = new Event<KafkaEventPayload>();
            event.type = KafkaEventType.KafkaEvent;
            event.payload = new KafkaEventPayload();
            event.payload.eventSource = rawEvent.eventSource;
            event.payload.eventSourceArn = rawEvent.eventSourceArn;

            if (rawEvent.records.hasOwnProperty(key)) {
                event.payload.topicName = rawEvent.records[key][0].topic;
                for(const topicRecord of rawEvent.records[key]){
                    const message = new KafkaMessageModel();
                    message.offset = topicRecord.offset;
                    message.partition = topicRecord.partition;
                    message.timestamp = new Date(topicRecord.timestamp);
                    message.timestampType = topicRecord.timestampType;
                    const decodedValue = new Buffer(topicRecord.value, 'base64').toString('ascii');
                    try {
                        message.value = JSON.parse(decodedValue);
                    } catch (e) {
                        message.value = decodedValue;
                    }
                    event.payload.messages.push(message);
                }
            }
            parsedEvents.push(event);
        }
        return parsedEvents;
    }

    supports(event: any): boolean {
        return event.hasOwnProperty("eventSource") &&
            event.eventSource === "aws:kafka"
    }

}
