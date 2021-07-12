import {injectable} from "tsyringe";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpResponseInterface} from "../interfaces/http-response.interface";
import * as http from "http";
import {IncomingMessage, request as httpRequest, RequestOptions} from "http";
import {request as httpsRequest} from "https";
import Url from 'url-parse';
import {tag} from "@pristine-ts/common";
import {HttpClientRequestError} from "../errors/http-client-request.error";
import {HttpWrapperInterface} from "../interfaces/http-wrapper.interface";
import querystring from "querystring";

@tag('HttpWrapperInterface')
@injectable()
export class HttpWrapper implements HttpWrapperInterface {
    /**
     * This method directly executes the Http or Https request and returns the response.
     * There is no processing done in this method.
     * @param request
     */
    executeRequest(request: HttpRequestInterface): Promise<HttpResponseInterface> {
        return new Promise((resolve, reject) => {
            // Define the options required by the http and https modules.
            const url = new Url(request.url, true);
            const options: RequestOptions = {
                host: url.hostname,
                path: url.pathname + ((url.query === {}) ? "" : "?" + querystring.escape(Object.keys(url.query).map(key => key + "=" + url.query[key]).join("&"))),
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

                res.on('end', async () => {
                    response.body = body;

                    return resolve(response);
                });
            }

            // Make the http or https call depending on the url.
            if (url.protocol === "http://" || url.protocol === "http:" || url.protocol === "http") {
                const req = httpRequest(options, callback);

                if (request.body) {
                    req.write(request.body);
                }

                return req.end();
            } else if (url.protocol === "https://" || url.protocol === "https:" || url.protocol === "https") {
                options.port = options.port ?? 443;

                const req = httpsRequest(options, callback);

                if (request.body) {
                    req.write(request.body);
                }

                return req.end();
            }

            return reject(new HttpClientRequestError("The protocol for the HttpRequest is invalid. It must be 'http' or 'https'.", request, url));
        })
    }
}
