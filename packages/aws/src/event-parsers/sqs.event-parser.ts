import {Event, EventParserInterface} from "@pristine-ts/event";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {SqsEventPayload} from "../event-payloads/sqs.event-payload";
import {SqsAttributesModel} from "../models/sqs-attributes.model";
import {SqsEventType} from "../enums/sqs-event-type.enum";

@tag(ServiceDefinitionTagEnum.EventParser)
@injectable()
export class SqsEventParser implements EventParserInterface<SqsEventPayload>{

    parse(rawEvent: any): Event<SqsEventPayload> {
        const event = new Event<SqsEventPayload>();
        event.type = SqsEventType.SqsEvent;
        event.payload =  new SqsEventPayload();

        event.payload.eventSource = rawEvent.eventSource;
        event.payload.awsRegion = rawEvent.awsRegion;
        event.payload.body = rawEvent.body;
        event.payload.eventSourceArn = rawEvent.eventSourceARN;
        event.payload.md5OfBody = rawEvent.md5OfBody;
        event.payload.messageAttributes = rawEvent.messageAttributes;
        event.payload.receiptHandle = rawEvent.receiptHandle;
        event.payload.messageId = rawEvent.messageId;

        if(rawEvent.attributes) {
            event.payload.attributes = new SqsAttributesModel();
            event.payload.attributes.approximateFirstReceiveTime = new Date(rawEvent.attributes.ApproximateFirstReceiveTimestamp);
            event.payload.attributes.sentTime = new Date(rawEvent.attributes.SentTimestamp);
            event.payload.attributes.senderId = rawEvent.attributes.SenderId;
            event.payload.attributes.approximateReceiveCount = isNaN(+rawEvent.attributes.ApproximateReceiveCount) ? undefined : +rawEvent.attributes.ApproximateReceiveCount;

            event.payload.attributes.messageGroupId = rawEvent.attributes.MessageGroupId;
            event.payload.attributes.messageDeduplicationId = rawEvent.attributes.MessageDeduplicationId;
            event.payload.attributes.sequenceNumber = isNaN(+rawEvent.attributes.SequenceNumber) ? undefined : +rawEvent.attributes.SequenceNumber;
        }
        return event;
    }

    supports(event: any): boolean {
        return event.hasOwnProperty("eventSource") &&
            event.eventSource === "aws:sqs"
    }

}
