import {HttpRequestContext} from "./http-request-context";

export class HttpRequest {
    version: string;
    routeKey: string;
    rawPath: string;
    rawQueryString: string;
    cookies: string[];
    headers: {[key: string]: string};
    requestContext: HttpRequestContext;
    isBase64Encoded: boolean;
}
