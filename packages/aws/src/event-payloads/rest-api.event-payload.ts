export class RestApiEventPayload {
    version: string;
    resource: string;
    path: string;
    httpMethod: string;
    requestContext: {
        resourceId?: string;
        resourcePath: string;
        httpMethod: string;
        extendedRequestId: string;
        requestTime: string;
        path: string;
        accountId: string;
        protocol: string;
        stage: string;
        domainPrefix: string;
        requestTimeEpoch: number;
        requestId: string;
        identity: {
            cognitoIdentityPoolId?: string;
            accountId?: string;
            cognitoIdentityId?: string;
            caller?: string;
            sourceIp?: string;
            principalOrgId?: string;
            accessKey?: string;
            cognitoAuthenticationType?: string;
            cognitoAuthenticationProvider?: string;
            userArn?: string;
            userAgent?: string;
            user?: string;
            clientCert: any;
        };
        domainName: string;
        apiId: string;
        authorizer: any;
    };
    headers: {[key: string]: string};
    multiValueHeaders: {[key: string]: string[]};
    queryStringParameters?: {[key: string]: string};
    multiValueQueryStringParameters?: {[key: string]: string[]};
    pathParameters?: {[key: string]: string};
    stageVariables?: {[key: string]: string};
    body?: string;
    isBase64Encoded: boolean;
}
