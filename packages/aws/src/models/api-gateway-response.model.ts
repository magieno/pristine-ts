/**
 * Model representing the Api gateway response.
 */
export class ApiGatewayResponseModel {
    statusCode: number;
    headers?: {[key: string]: string};
    isBase64Encoded: boolean;
    multiValueHeaders?: {[key: string]: string[]};
    body?: string;
}
