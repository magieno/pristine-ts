/**
 * Model representing the http request (version 2.0) context http from the Api gateway event.
 */
export class HttpRequestContextHttpModel {
    method: string;
    path: string;
    protocol: string;
    sourceIp: string;
    userAgent: string;
}
