import {
    Event,
    EventMapperInterface,
    EventResponse,
    ExecutionContextInterface, EventsExecutionOptionsInterface
} from "@pristine-ts/core";
import {S3EventPayload} from "../event-payloads/s3.event-payload";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import { injectable } from "tsyringe";
import {S3EventType} from "../enums/s3-event-type.enum";
import {IdentityModel} from "../models/identity.model";
import {RequestParametersModel} from "../models/request-parameters.model";
import {ResponseElementsModel} from "../models/response-elements.model";
import {S3Model} from "../models/s3.model";
import {S3BucketModel} from "../models/s3-bucket.model";
import {S3ObjectModel} from "../models/s3-object.model";
import {AwsModuleKeyname} from "../aws.module.keyname";

/**
 * Mapper to map the S3 event into a Pristine event.
 * It is tagged as an ServiceDefinitionTagEnum.EventMapper so that it can be injected with all the other event mappers.
 * It is module scoped so that it gets injected only if the AWS module is imported.
 */
@moduleScoped(AwsModuleKeyname)
@tag(ServiceDefinitionTagEnum.EventMapper)
@injectable()
export class S3EventMapper implements EventMapperInterface<S3EventPayload, void>{

    /**
     * Finds the enum value corresponding to the event name.
     * @param eventName The event name of the S3 event.
     * @private
     */
    private findEnum(eventName: string): S3EventType{
        const keys = Object.keys(S3EventType).filter(key => isNaN(Number(key)));
        for(const key of keys){
            if (S3EventType[key] === eventName){
                return S3EventType[key];
            }
        }
        return S3EventType.UnknownS3Event;
    }

    /**
     * Parses the S3 event into a Pristine event.
     * @param rawEvent The raw S3 event
     * @param executionContext The ExecutionContext from where the event is triggered. It can easily be used to determine
     * where the current service is hosted.
     */
    map(rawEvent: any, executionContext: ExecutionContextInterface<any>): EventsExecutionOptionsInterface<S3EventPayload> {
        const parsedEvents: Event<S3EventPayload>[] = [];
        for(const record of rawEvent.Records) {
            const event = new Event<S3EventPayload>(this.findEnum(record.eventName), new S3EventPayload());

            event.payload.eventVersion = record.eventVersion;
            event.payload.eventSource = record.eventSource;
            event.payload.awsRegion = record.awsRegion;
            event.payload.eventTime = new Date(record.eventTime);
            event.payload.eventName = record.eventName;
            event.payload.userIdentity = new IdentityModel();
            event.payload.userIdentity.principalId = record.userIdentity?.principalId
            event.payload.requestParameters = new RequestParametersModel();
            event.payload.requestParameters.sourceIPAddress = record.requestParameters?.sourceIPAddress;
            event.payload.responseElements = new ResponseElementsModel();
            if (record.responseElements) {
                event.payload.responseElements["x-amz-request-id"] = record.responseElements["x-amz-request-id"];
                event.payload.responseElements["x-amz-id-2"] = record.responseElements["x-amz-id-2"];
            }

            event.payload.s3 = new S3Model();
            event.payload.s3.s3SchemaVersion = record.s3.s3SchemaVersion;
            event.payload.s3.configurationId = record.s3.configurationId;
            event.payload.s3.bucket = new S3BucketModel();
            event.payload.s3.bucket.ownerIdentity = new IdentityModel();
            event.payload.s3.bucket.ownerIdentity.principalId = record.s3.bucket?.ownerIdentity?.principalId;
            event.payload.s3.bucket.name = record.s3.bucket?.name;
            event.payload.s3.bucket.arn = record.s3.bucket?.arn;
            event.payload.s3.object = new S3ObjectModel();
            event.payload.s3.object.key = record.s3.object.key;
            event.payload.s3.object.size = record.s3.object.size;
            event.payload.s3.object.eTag = record.s3.object.eTag;
            event.payload.s3.object.versionId = record.s3.object.versionId;
            event.payload.s3.object.sequencer = record.s3.object.sequencer;

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
            event.Records[0].hasOwnProperty("eventSource") &&
            event.Records[0].eventSource === "aws:s3" &&
            event.Records[0].hasOwnProperty("s3")
    }

    /**
     * Determines if the parser supports mapping the Pristine event to an event response.
     * For now it does not support a response.
     * @param eventResponse The event response.
     * @param response The response.
     * @param executionContext The execution context of the event.
     */
    supportsReverseMapping(eventResponse: EventResponse<S3EventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): boolean {
        // todo: implement
        return false;
    }

    /**
     * Reverse maps the Pristine event into an event response.
     * For now it does not mapping a Pristine event to an S3 event response.
     * @param eventResponse The event response.
     * @param response The response.
     * @param executionContext The execution context of the event.
     */
    reverseMap(eventResponse: EventResponse<S3EventPayload, void>, response: any, executionContext: ExecutionContextInterface<any>): void {
        // todo: implement
    }
}
