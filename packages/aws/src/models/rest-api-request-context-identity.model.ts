/**
 * Model representing the rest api request (version 1.0) context identity from the Api gateway event.
 */
export class RestApiRequestContextIdentityModel {
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
}
