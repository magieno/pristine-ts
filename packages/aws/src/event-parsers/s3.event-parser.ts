import {Event, EventParserInterface} from "@pristine-ts/event";
import {S3EventPayload} from "../event-payloads/s3.event-payload";
import {EventType} from "../enums/event-type.enum";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import { injectable } from "tsyringe";

@tag(ServiceDefinitionTagEnum.EventParser)
@injectable()
export class S3EventParser implements EventParserInterface<S3EventPayload>{

    parse(rawEvent: any): Event<S3EventPayload> {
        const event = new Event<S3EventPayload>();
        event.type = EventType.S3Event;
        event.payload =  new S3EventPayload();

        event.payload.eventVersion = rawEvent.eventVersion;
        event.payload.eventSource = rawEvent.eventSource;
        event.payload.awsRegion = rawEvent.awsRegion;
        event.payload.eventTime = new Date(rawEvent.eventTime);
        event.payload.eventName = rawEvent.eventName;
        event.payload.userIdentity = {
            principalId: rawEvent.userIdentity.principalId,
        };
        event.payload.requestParameters = {
            sourceIPAddress : rawEvent.requestParameters.sourceIPAddress,
        };
        event.payload.responseElements = {
            "x-amz-request-id" :  rawEvent.responseElements["x-amz-request-id"],
            "x-amz-id-2" : rawEvent.responseElements["x-amz-id-2"],
        };

        event.payload.s3 = {
            s3SchemaVersion: rawEvent.s3.s3SchemaVersion,
            configurationId: rawEvent.s3.configurationId,
            bucket: {
                ownerIdentity:{
                    principalId: rawEvent.s3.bucket.ownerIdentity.principalId,
                },
                name: rawEvent.s3.bucket.name,
                arn: rawEvent.s3.bucket.arn,
            },
            object: {
                key: rawEvent.s3.object.key,
                size: rawEvent.s3.object.size,
                eTag: rawEvent.s3.object.eTag,
                versionId: rawEvent.s3.object.versionId,
                sequencer: rawEvent.s3.object.sequencer,
            },
        };

        return event;
    }

    supports(event: any): boolean {
        return event.hasOwnProperty("eventSource") &&
            event.eventSource === "aws:s3" &&
            event.hasOwnProperty("s3") &&
            event.s3.hasOwnProperty("bucket") &&
            event.s3.hasOwnProperty("object")
    }

}
