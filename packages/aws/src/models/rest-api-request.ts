import {RestApiRequestContext} from "./rest-api-request-context";

export class RestApiRequest {
    resource: string;
    path: string;
    httpMethod: string;
    requestContext: RestApiRequestContext;
    headers: {[key: string]: string};
    multiValueHeaders: {[key: string]: string[]};
    queryStringParameters?: {[key: string]: string};
    multiValueQueryStringParameters?: {[key: string]: string[]};
    pathParameters?: string;
    stageVariables?: string;
    body?: string;
    isBase64Encoded: boolean;
}
