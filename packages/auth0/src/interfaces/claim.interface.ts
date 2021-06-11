export interface ClaimInterface {
    iss: string;
    sub: string;
    exp: number;
    aud: string[];
    scope: string;
    [key: string]: any;
}
