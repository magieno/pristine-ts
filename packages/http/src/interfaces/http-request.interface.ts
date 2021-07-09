import {HttpMethod} from "@pristine-ts/common";

export interface HttpRequestInterface {
    httpMethod: string | HttpMethod;
    url: string;
    headers?: { [key: string]: string };
    body?: string | Buffer | Uint8Array;
}
