import {HttpRequestContextModel} from "../models/http-request-context.model";

export class HttpRequestEventPayload {
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
