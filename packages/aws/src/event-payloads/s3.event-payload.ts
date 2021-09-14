import {IdentityModel} from "../models/identity.model";
import {RequestParametersModel} from "../models/request-parameters.model";
import {ResponseElementsModel} from "../models/response-elements.model";
import {S3Model} from "../models/s3.model";

/**
 * The Pristine event payload type of a parsed S3 event
 */
export class S3EventPayload {
    eventVersion: string;
    eventSource: string;
    awsRegion: string;
    // The time when Amazon S3 finished processing the request
    eventTime: Date;
    eventName: string;
    // Amazon-customer-ID-of-the-user-who-caused-the-event
    userIdentity: IdentityModel;
    requestParameters: RequestParametersModel;
    responseElements: ResponseElementsModel;
    s3: S3Model;
}
