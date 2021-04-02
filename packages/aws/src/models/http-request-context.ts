import {HttpRequestContextHttp} from "./http-request-context-http";

export class HttpRequestContext{
    accountId: string;
    apiId: string;
    domainName: string;
    domainPrefix: string;
    http: HttpRequestContextHttp;
    requestId: string[];
    routeKey: string;
    stage: string;
    time: string;
    timeEpoch: number;
}
