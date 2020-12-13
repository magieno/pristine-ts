import {HttpMethod} from "../enums/http-method.enum";

export interface Request {
    httpMethod: HttpMethod | string;
    url: string;
    headers?: { [key: string]: string };
    body?: any;
}