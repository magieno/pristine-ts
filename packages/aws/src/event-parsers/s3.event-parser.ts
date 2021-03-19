import {Event, EventParserInterface} from "@pristine-ts/event";
import {S3EventPayload} from "../event-payloads/s3.event-payload";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import { injectable } from "tsyringe";
import {S3EventType} from "../enums/s3-event-type.enum";
import {IdentityModel} from "../models/identity.model";
import {RequestParametersModel} from "../models/request-parameters.model";
import {ResponseElementsModel} from "../models/response-elements.model";
import {S3Model} from "../models/s3.model";
import {S3BucketModel} from "../models/s3-bucket.model";
import {S3ObjectModel} from "../models/s3-object.model";

@tag(ServiceDefinitionTagEnum.EventParser)
@injectable()
export class S3EventParser implements EventParserInterface<S3EventPayload>{

    private findEnum(eventName: string): S3EventType{
        const keys = Object.keys(S3EventType).filter(key => isNaN(Number(key)));
        for(const key of keys){
            if (S3EventType[key] === eventName){
                return S3EventType[key];
            }
        }
        return S3EventType.UnknownS3Event;
    }

    parse(rawEvent: any): Event<S3EventPayload> {
        const event = new Event<S3EventPayload>();
        event.type = this.findEnum(rawEvent.eventName);
        event.payload =  new S3EventPayload();

        event.payload.eventVersion = rawEvent.eventVersion;
        event.payload.eventSource = rawEvent.eventSource;
        event.payload.awsRegion = rawEvent.awsRegion;
        event.payload.eventTime = new Date(rawEvent.eventTime);
        event.payload.eventName = rawEvent.eventName;
        event.payload.userIdentity = new IdentityModel();
        event.payload.userIdentity.principalId = rawEvent.userIdentity?.principalId
        event.payload.requestParameters = new RequestParametersModel();
        event.payload.requestParameters.sourceIPAddress = rawEvent.requestParameters?.sourceIPAddress;
        event.payload.responseElements = new ResponseElementsModel();
        if(rawEvent.responseElements){
            event.payload.responseElements["x-amz-request-id"] =  rawEvent.responseElements["x-amz-request-id"];
            event.payload.responseElements["x-amz-id-2"] = rawEvent.responseElements["x-amz-id-2"];
        }

        event.payload.s3 = new S3Model();
        event.payload.s3.s3SchemaVersion = rawEvent.s3.s3SchemaVersion;
        event.payload.s3.configurationId = rawEvent.s3.configurationId;
        event.payload.s3.bucket = new S3BucketModel();
        event.payload.s3.bucket.ownerIdentity = new IdentityModel();
        event.payload.s3.bucket.ownerIdentity.principalId = rawEvent.s3.bucket?.ownerIdentity?.principalId;
        event.payload.s3.bucket.name = rawEvent.s3.bucket?.name;
        event.payload.s3.bucket.arn = rawEvent.s3.bucket?.arn;
        event.payload.s3.object = new S3ObjectModel();
        event.payload.s3.object.key = rawEvent.s3.object.key;
        event.payload.s3.object.size = rawEvent.s3.object.size;
        event.payload.s3.object.eTag = rawEvent.s3.object.eTag;
        event.payload.s3.object.versionId = rawEvent.s3.object.versionId;
        event.payload.s3.object.sequencer = rawEvent.s3.object.sequencer;
        return event;
    }

    supports(event: any): boolean {
        return event.hasOwnProperty("eventSource") &&
            event.eventSource === "aws:s3" &&
            event.hasOwnProperty("s3")
    }

}
