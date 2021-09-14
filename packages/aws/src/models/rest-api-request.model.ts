import {RestApiRequestContextModel} from "./rest-api-request-context.model";

/**
 * Model representing the rest api request (version 1.0) from the Api gateway event.
 */
export class RestApiRequestModel {
    version: string;
    resource: string;
    path: string;
    httpMethod: string;
    requestContext: RestApiRequestContextModel;
    headers: {[key: string]: string};
    multiValueHeaders: {[key: string]: string[]};
    queryStringParameters?: {[key: string]: string};
    multiValueQueryStringParameters?: {[key: string]: string[]};
    pathParameters?: {[key: string]: string};
    stageVariables?: {[key: string]: string};
    body?: string;
    isBase64Encoded: boolean;
}
