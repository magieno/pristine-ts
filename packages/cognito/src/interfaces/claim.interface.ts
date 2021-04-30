export interface ClaimInterface {
    token_use: string;
    auth_time: number;
    iss: string;
    exp: number;
    username: string;
    client_id: string;
    [key: string]: any;
}
