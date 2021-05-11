import {injectable} from "tsyringe";
import {HttpClientInterface} from "../interfaces/http-client.interface";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpResponseInterface} from "../interfaces/http-response.interface";
import {IncomingMessage, request as httpRequest, RequestOptions} from "http";
import {request as httpsRequest} from "https";
import Url from 'url-parse';
import {InvalidHttpRequestProtocolError} from "../errors/invalid-http-request-protocol.error";

@injectable()
export class HttpClient implements HttpClientInterface {
    request(request: HttpRequestInterface): Promise<HttpResponseInterface> {
        return new Promise((resolve, reject) => {
            const url = new Url(request.url, true);
            const options: RequestOptions = {
                host: url.hostname,
                path: url.pathname + "?" + Object.keys(url.query).map(key => key + "=" + url.query).join("&"),
                method: request.httpMethod,
                headers: request.headers,
                port: url.port,
            }

            const defaultResponseStatus = 200; // todo: decide if that's how we should proceed
            const response: HttpResponseInterface = {
                request,
                status: defaultResponseStatus,
            };

            const callback = (res: IncomingMessage) => {
                response.headers = res.headers as {
                    [key: string]: string;
                };
                response.status = res.statusCode ?? defaultResponseStatus;

                let body = '';

                res.on('data', chunk => {
                    body = body + "" + chunk;
                });

                res.on('error', error => {
                    return reject(error);
                })

                res.on('end', () => {
                    response.body = body;
                    return resolve(response);
                });
            }

            if(url.protocol === "http://" || url.protocol === "http:" || url.protocol === "http") {
                const req = httpRequest(options, callback);

                if(request.body) {
                    req.write(request.body);
                }

                return req.end();
            }
            else if( url.protocol === "https://" || url.protocol === "https:" || url.protocol === "https") {
                options.port = options.port ?? 443;

                const req = httpsRequest(options, callback);

                if(request.body) {
                    req.write(request.body);
                }

                return req.end();
            }

            return reject(new InvalidHttpRequestProtocolError("The protocol for the HttpRequest is invalid. It must be 'http' or 'https', you provided: '" + url.protocol + "'"));
        });
    }
}
