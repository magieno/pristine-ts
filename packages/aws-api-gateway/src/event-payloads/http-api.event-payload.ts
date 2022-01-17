export class HttpApiEventPayload {
    version: string;
    routeKey: string;
    rawPath: string;
    rawQueryString?: string;
    cookies: string[] = [];
    headers: {[key: string]: string} = {};
    queryStringParameters: {[key: string]: string} = {};
    requestContext?: {
        accountId: string;
        apiId: string;
        domainName: string;
        domainPrefix: string;
        http: {
            method: string;
            path: string;
            protocol: string;
            sourceIp: string;
            userAgent: string;
        };
        requestId: string;
        routeKey: string;
        stage: string;
        time: string;
        timeEpoch: number;
        authentication: any;
        authorizer: any;
    };
    isBase64Encoded?: boolean;
    body?: string;
    pathParameters?: {[key: string]: string};
    stageVariables?: {[key: string]: string};

    constructor(version: string, routeKey: string, rawPath: string) {
        this.version = version;
        this.routeKey = routeKey;
        this.rawPath = rawPath;
    }
}
