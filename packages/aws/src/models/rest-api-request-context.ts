import {RestApiRequestContextIdentity} from "./rest-api-request-context-identity";

export class RestApiRequestContext {
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
    identity: RestApiRequestContextIdentity;
    domainName: string;
    apiId: string;
}
