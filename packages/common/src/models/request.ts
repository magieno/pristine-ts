/**
 * This Request object represents the class used internally that represents a Request.
 */
import {HttpMethod} from "../enums/http-method.enum";
import {values} from "lodash";

export class Request {
    /**
     * The http method of the request.
     */
    httpMethod: HttpMethod | string;

    /**
     * The url of the request.
     */
    url: string;

    /**
     * The headers of the request.
     */
    private _headers: { [key: string]: string } = {};

    /**
     * The body of the request.
     */
    body: any = {};

    /**
     * The raw body of the request.
     */
    rawBody?: any;

    constructor(httpMethod: HttpMethod | string, url: string) {
        this.httpMethod = httpMethod;
        this.url = url;
    }

    /**
     * This method returns all the headers.
     */
    get headers(): { [key: string]: string } {
        return this._headers;
    }

    /**
     * This method sets the headers appropriately.
     *
     * @param headers
     */
    public setHeaders(headers: { [key: string]: string }) {
        for (const name in headers) {
            if(headers.hasOwnProperty(name) === false) {
                continue;
            }

            this.setHeader(name, headers[name])
        }
    }

    /**
     * This method sets a header parameter in the Request.
     *
     * @param name The name of the header.
     * @param value The value of the header.
     */
    public setHeader(name: string, value: string) {
        this.headers[name.toLowerCase()] = value;
    }

    /**
     * This method returns whether or not the header exists in the Request.
     *
     * @param name The name of the header.
     */
    public hasHeader(name: string): boolean {
        return this.headers.hasOwnProperty(name.toLowerCase());
    }

    /**
     * This method returns the header corresponding to the name or undefined if it doesn't exist.
     *
     * @param name The name of the header.
     */
    public getHeader(name: string): string | undefined {
        return this.headers[name.toLowerCase()];
    }
}
