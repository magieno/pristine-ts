import {
    Event,
    EventMapperInterface,
    EventResponse,
    ExecutionContextInterface, EventsExecutionOptionsInterface
} from "@pristine-ts/core";
import { moduleScoped, ServiceDefinitionTagEnum, tag } from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {SnsEventPayload} from "../event-payloads/sns.event-payload";
import {SnsEventType} from "../enums/sns-event-type.enum";
import {SnsModel} from "../models/sns.model";
import {SnsMessageAttributeModel} from "../models/sns-message-attribute.model";
import { AwsModuleKeyname } from "../aws.module.keyname";
import {v4 as uuidv4} from "uuid";

/**
 * Mapper to map the Sns event into a Pristine event.
 * It is tagged as an ServiceDefinitionTagEnum.EventMapper so that it can be injected with all the other event mappers.
 * It is module scoped so that it gets injected only if the AWS module is imported.
 */
@tag(ServiceDefinitionTagEnum.EventMapper)
@moduleScoped(AwsModuleKeyname)
@injectable()
export class SnsEventMapper implements EventMapperInterface<SnsEventPayload, void>{

    /**
     * Finds the enum value corresponding to the event name.
     * @param eventName The event name of the SNS event.
     * @private
     */
    private findEnum(eventName: string): SnsEventType{
        const keys = Object.keys(SnsEventType).filter(key => isNaN(Number(key)));
        for(const key of keys){
            if (SnsEventType[key] === eventName){
                return SnsEventType[key];
            }
        }
        return SnsEventType.UnknownSnsEvent;
    }

    /**
     * Parses the SNS event into a Pristine event.
     * @param rawEvent The raw SNS event
     * @param executionContext The ExecutionContext from where the event is triggered. It can easily be used to determine
     * where the current service is hosted.
     */
    map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<SnsEventPayload> {
        const parsedEvents: Event<SnsEventPayload>[] = [];
        for(const record of rawEvent.Records) {
            const event = new Event<SnsEventPayload>(this.findEnum(record.Sns.Type), new SnsEventPayload(), record.Sns.MessageId);

            event.payload.eventSource = record.EventSource;
            event.payload.eventSubscriptionArn = record.EventSubscriptionArn;
            event.payload.eventVersion = record.EventVersion;
            event.payload.sns = new SnsModel();
            event.payload.sns.signatureVersion = record.Sns.SignatureVersion;
            event.payload.sns.eventTime = new Date(record.Sns.Timestamp);
            event.payload.sns.signature = record.Sns.Signature;
            event.payload.sns.signingCertUrl = record.Sns.SigningCertUrl;
            event.payload.sns.messageId = record.Sns.MessageId;
            event.payload.sns.message = record.Sns.Message;
            event.payload.sns.type = record.Sns.Type;
            event.payload.sns.unsubscribeUrl = record.Sns.UnsubscribeUrl;
            event.payload.sns.topicArn = record.Sns.TopicArn;
            event.payload.sns.subject = record.Sns.Subject;

            if (record.Sns.hasOwnProperty("MessageAttributes")) {
                event.payload.sns.messageAttributes = [];
                for (const key in record.Sns.MessageAttributes) {
                    if (record.Sns.MessageAttributes.hasOwnProperty(key)) {
                        const attribute = new SnsMessageAttributeModel();
                        attribute.key = key;
                        attribute.type = record.Sns.MessageAttributes[key].Type;
                        attribute.value = record.Sns.MessageAttributes[key].Value;
                        event.payload.sns.messageAttributes.push(attribute);
                    }
                }
            }
            parsedEvents.push(event);
        }

        return {
            executionOrder: 'parallel',
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
        return event.hasOwnProperty("Records") &&
            Array.isArray(event.Records) &&
            event.Records[0].hasOwnProperty("EventSource") &&
            event.Records[0].EventSource === "aws:sns" &&
            event.Records[0].hasOwnProperty("Sns")
    }

    /**
     * Determines if the parser supports mapping the Pristine event to an event response.
     * For now it does not support a response.
     * @param eventResponse The event response.
     * @param response The response.
     * @param executionContext The execution context of the event.
     */
    supportsReverseMapping(eventResponse: EventResponse<SnsEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
        // todo: implement
        return false;
    }

    /**
     * Reverse maps the Pristine event into an event response.
     * For now it does not mapping a Pristine event to an Sns event response.
     * @param eventResponse The event response.
     * @param response The response.
     * @param executionContext The execution context of the event.
     */
    reverseMap(eventResponse: EventResponse<SnsEventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): void {
        // todo: implement
    }
}
