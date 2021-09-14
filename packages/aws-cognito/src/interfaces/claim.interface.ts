/**
 * The interface of the claims in AWS Cognito.
 */
export interface ClaimInterface {
    token_use: string;
    auth_time: number;
    iss: string;
    exp: number;
    ["cognito:username"]: string;
    client_id: string;
    ["cognito:groups"]: string[];
    [key: string]: any;
}
