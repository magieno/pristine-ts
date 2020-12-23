import {HttpMethod} from "../enums/http-method.enum";
import {RequestInterface} from "../interfaces/request.interface";

/**
 * This Request object represents the class used internally that represents a Request.
 */
export class Request implements RequestInterface {
    httpMethod: HttpMethod | string;
    url: string;
    headers: { [key: string]: string } = {};
    body: any = {};

    constructor(requestInterface: RequestInterface) {
        this.httpMethod = requestInterface.httpMethod;
        this.url = requestInterface.url;
        this.headers = requestInterface.headers ?? {};
        this.body = requestInterface.body ?? {};
    }

    /**
     * This method sets a header parameter in the Request.
     *
     * @param name
     * @param value
     */
    setHeader(name: string, value: string) {
        this.headers[name] = value;
    }

    /**
     * This method returns whether or not the header exists in the Request.
     *
     * @param name
     */
    hasHeader(name: string): boolean {
        return this.headers.hasOwnProperty(name);
    }

    /**
     * This method returns the header corresponding to the name or undefined if it doesn't exist.
     *
     * @param name
     */
    getHeader(name: string): string | undefined {
        return this.headers[name];
    }
}