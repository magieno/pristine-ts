import {HttpRequestContextHttpModel} from "./http-request-context-http.model";

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
