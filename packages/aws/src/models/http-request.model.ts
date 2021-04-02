import {HttpRequestContextModel} from "./http-request-context.model";

export class HttpRequestModel {
    version: string;
    routeKey: string;
    rawPath: string;
    rawQueryString: string;
    cookies: string[];
    headers: {[key: string]: string};
    requestContext: HttpRequestContextModel;
    isBase64Encoded: boolean;
}
