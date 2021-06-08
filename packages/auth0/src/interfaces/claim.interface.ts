export interface ClaimInterface {
    token_use: string;
    auth_time: number;
    iss: string;
    exp: number;
    roles: string;
    client_id: string;
    [key: string]: any;
}
