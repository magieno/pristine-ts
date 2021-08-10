import {RestApiRequestContextIdentityModel} from "./rest-api-request-context-identity.model";

/**
 * Model representing the rest api request (version 1.0) context from the Api gateway event.
 */
export class RestApiRequestContextModel {
    resourceId?: string;
    resourcePath: string;
    httpMethod: string;
    extendedRequestId: string;
    requestTime: string;
    path: string;
    accountId: string;
    protocol: string;
    stage: string;
    domainPrefix: string;
    requestTimeEpoch: number;
    requestId: string;
    identity: RestApiRequestContextIdentityModel;
    domainName: string;
    apiId: string;
    authorizer: any;
}
