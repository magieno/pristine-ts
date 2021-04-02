export class ApiGatewayResponse {
    statusCode: number;
    headers?: {[key: string]: string};
    isBase64Encoded: boolean;
    multiValueHeaders?: {[key: string]: string[]};
    body?: string;
}
