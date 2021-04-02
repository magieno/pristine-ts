import {RestApiRequestContextIdentityModel} from "./rest-api-request-context-identity.model";

export class RestApiRequestContextModel {
    resourceId: string;
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
}
