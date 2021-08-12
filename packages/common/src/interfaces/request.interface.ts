import {HttpMethod} from "../enums/http-method.enum";

/**
 * This interface defines the fields that must be present in a Request. This interface is used to communicate
 * externally with this module. When dealing with requests internally, we transform this request interface into
 * the Request object since it contains methods that make working with the Request more easily.
 */
export interface RequestInterface {
    /**
     * The http method used in the request.
     */
    httpMethod: string | HttpMethod;

    /**
     * The url of the request.
     */
    url: string;

    /**
     * The headers of the request.
     */
    headers?: { [key: string]: string };

    /**
     * The parsed body of the request.
     */
    body?: any;

    /**
     * The raw body of the request.
     */
    rawBody?: any;
}
