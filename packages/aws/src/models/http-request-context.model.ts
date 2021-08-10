import {HttpRequestContextHttpModel} from "./http-request-context-http.model";

/**
 * Model representing the http request (version 2.0) context from the Api gateway event.
 */
export class HttpRequestContextModel {
    accountId: string;
    apiId: string;
    domainName: string;
    domainPrefix: string;
    http: HttpRequestContextHttpModel;
    requestId: string;
    routeKey: string;
    stage: string;
    time: string;
    timeEpoch: number;
    authentication: any;
    authorizer: any;
}
