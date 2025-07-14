import {Event, EventMapperInterface, EventResponse, ExecutionContextInterface, EventsExecutionOptionsInterface} from "@pristine-ts/core";
import { moduleScoped, ServiceDefinitionTagEnum, tag } from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {KafkaEventPayload} from "../event-payloads/kafka.event-payload";
import {KafkaEventType} from "../enums/kafka-event-type.enum";
import {KafkaMessageModel} from "../models/kafka-message.model";
import { AwsModuleKeyname } from "../aws.module.keyname";
import {v4 as uuidv4} from "uuid";

/**
 * Mapper to map the Kafka event from the AWS kafka connector into a Pristine event.
 * It is tagged as an ServiceDefinitionTagEnum.EventMapper so that it can be injected with all the other event mappers.
 * It is module scoped so that it gets injected only if the AWS module is imported.
 */
@tag(ServiceDefinitionTagEnum.EventMapper)
@moduleScoped(AwsModuleKeyname)
@injectable()
export class KafkaEventMapper implements EventMapperInterface<KafkaEventPayload, void>{

    /**
     * Parses the Kafka event from the AWS kafka connector into a Pristine event.
     * @param rawEvent The raw Kafka event
     * @param executionContext The ExecutionContext from where the event is triggered. It can easily be used to determine
     * where the current service is hosted.
     */
    map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<KafkaEventPayload> {
        const parsedEvents: Event<KafkaEventPayload>[] = [];

        for(const key in rawEvent.records) {
            const event = new Event<KafkaEventPayload>(KafkaEventType.KafkaEvent, new KafkaEventPayload(), "kafka");
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
     * @param executionContext The ExecutionContext from where the event is triggered. It can easily be used to determine
     * where the current service is hosted.
     */
    supportsMapping(event: any, executionContext: ExecutionContextInterface<any>): boolean {
        return event.hasOwnProperty("eventSource") &&
            event.eventSource === "aws:kafka"
    }

    /**
     * Determines if the parser supports mapping the Pristine event to an event response.
     * For now it does not support a response.
     * @param eventResponse The event response.
     * @param response The response.
     * @param executionContext The execution context of the event.
     */
    supportsReverseMapping(eventResponse: EventResponse<KafkaEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
        // todo: implement
        return false;
    }

    /**
     * Reverse maps the Pristine event into an event response.
     * For now it does not mapping a Pristine event to a Kafka event response.
     * @param eventResponse The event response.
     * @param response The response.
     * @param executionContext The execution context of the event.
     */
    reverseMap(eventResponse: EventResponse<KafkaEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): void {
        // todo: implement
    }
}
