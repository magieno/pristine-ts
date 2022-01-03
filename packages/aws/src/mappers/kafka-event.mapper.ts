import {Event, EventMapperInterface, EventResponse, ExecutionContextInterface} from "@pristine-ts/core";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {KafkaEventPayload} from "../event-payloads/kafka.event-payload";
import {KafkaEventType} from "../enums/kafka-event-type.enum";
import {KafkaMessageModel} from "../models/kafka-message.model";
import {DynamodbEventPayload} from "../event-payloads/dynamodb.event-payload";
import {EventsExecutionOptionsInterface} from "@pristine-ts/core/dist/types/interfaces/events-execution-options.interface";
import {EventBridgePayload} from "../event-payloads/event-bridge.payload";

@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class KafkaEventMapper implements EventMapperInterface<KafkaEventPayload, void>{

    /**
     * Parses the Kafka event from the AWS kafka connector into a Pristine event.
     * @param rawEvent The raw Kafka event
     * @param executionContext
     */
    map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<KafkaEventPayload> {
        const parsedEvents: Event<KafkaEventPayload>[] = [];

        for(const key in rawEvent.records) {
            const event = new Event<KafkaEventPayload>(KafkaEventType.KafkaEvent, new KafkaEventPayload());
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

        return {
            executionOrder: 'sequential',
            events: parsedEvents,
        };
    }

    /**
     * Determines if the parser supports the event.
     * @param event The event to verify if the parser supports.
     */
    supportsMapping(event: any, executionContext: ExecutionContextInterface<any>): boolean {
        return event.hasOwnProperty("eventSource") &&
            event.eventSource === "aws:kafka"
    }

    supportsReverseMapping(eventResponse: EventResponse<KafkaEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
        // todo: implement
        return false;
    }

    reverseMap(eventResponse: EventResponse<KafkaEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): void {
        // todo: implement
    }
}
