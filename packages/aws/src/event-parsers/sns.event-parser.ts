import {Event, EventParserInterface} from "@pristine-ts/event";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {SnsEventPayload} from "../event-payloads/sns.event-payload";
import {SnsEventType} from "../enums/sns-event-type.enum";
import {SnsModel} from "../models/sns.model";
import {SnsMessageAttributeModel} from "../models/sns-message-attribute.model";

@tag(ServiceDefinitionTagEnum.EventParser)
@injectable()
export class SnsEventParser implements EventParserInterface<SnsEventPayload>{

    private findEnum(eventName: string): SnsEventType{
        const keys = Object.keys(SnsEventType).filter(key => isNaN(Number(key)));
        for(const key of keys){
            if (SnsEventType[key] === eventName){
                return SnsEventType[key];
            }
        }
        return SnsEventType.UnknownSnsEvent;
    }

    parse(rawEvent: any): Event<SnsEventPayload> {
        const event = new Event<SnsEventPayload>();
        event.type = this.findEnum(rawEvent.Sns.Type)
        event.payload =  new SnsEventPayload();

        event.payload.eventSource = rawEvent.EventSource;
        event.payload.eventSubscriptionArn = rawEvent.EventSubscriptionArn;
        event.payload.eventVersion = rawEvent.EventVersion;
        event.payload.sns = new SnsModel();
        event.payload.sns.signatureVersion = rawEvent.Sns.SignatureVersion;
        event.payload.sns.eventTime = new Date(rawEvent.Sns.Timestamp);
        event.payload.sns.signature = rawEvent.Sns.Signature;
        event.payload.sns.signingCertUrl = rawEvent.Sns.SigningCertUrl;
        event.payload.sns.messageId = rawEvent.Sns.MessageId;
        event.payload.sns.message = rawEvent.Sns.Message;
        event.payload.sns.type = rawEvent.Sns.Type;
        event.payload.sns.unsubscribeUrl = rawEvent.Sns.UnsubscribeUrl;
        event.payload.sns.topicArn = rawEvent.Sns.TopicArn;
        event.payload.sns.subject = rawEvent.Sns.Subject;

        if(rawEvent.Sns.hasOwnProperty("MessageAttributes")) {
            event.payload.sns.messageAttributes = [];
            for (const key in rawEvent.Sns.MessageAttributes){
                if(rawEvent.Sns.MessageAttributes.hasOwnProperty(key)){
                    const attribute = new SnsMessageAttributeModel();
                    attribute.key = key;
                    attribute.type = rawEvent.Sns.MessageAttributes[key].Type;
                    attribute.value = rawEvent.Sns.MessageAttributes[key].Value;
                    event.payload.sns.messageAttributes.push(attribute);
                }
            }
        }

        return event;
    }

    supports(event: any): boolean {
        return event.hasOwnProperty("EventSource") &&
            event.EventSource === "aws:sns" &&
            event.hasOwnProperty("Sns")
    }

}
