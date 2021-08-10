import {HttpRequestContextModel} from "./http-request-context.model";

/**
 * Model representing the http request (version 2.0) from the Api gateway event.
 */
export class HttpRequestModel {
    version: string;
    routeKey: string;
    rawPath: string;
    rawQueryString: string;
    cookies: string[];
    headers: {[key: string]: string};
    queryStringParameters: {[key: string]: string};
    requestContext: HttpRequestContextModel;
    isBase64Encoded: boolean;
    body?: string;
    pathParameters?: {[key: string]: string};
    stageVariables?: {[key: string]: string};
}
