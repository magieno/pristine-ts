/**
 * This interface defines the fields that must be present in a Request. This interface is used to communicate
 * externally with this module. When doing with requests internally, we transform this request interface into
 * the Request object since it contains methods that make working with the Request more easily.
 */
export interface RequestInterface {
    httpMethod: string;
    url: string;
    headers?: { [key: string]: string };
    body?: any;
}