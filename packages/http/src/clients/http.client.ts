import {inject, injectable, injectAll} from "tsyringe";
import {HttpClientInterface} from "../interfaces/http-client.interface";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpResponseInterface} from "../interfaces/http-response.interface";
import * as http from "http";
import {IncomingMessage, request as httpRequest, RequestOptions} from "http";
import {request as httpsRequest} from "https";
import Url from 'url-parse';
import {InvalidHttpRequestProtocolError} from "../errors/invalid-http-request-protocol.error";
import {ResponseTypeEnum} from "../enums/response-type.enum";
import {HttpRequestOptions} from "../options/http-request.options.";
import {assign} from "lodash";
import {ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {HttpRequestInterceptorInterface} from "../interfaces/http-request-interceptor.interface";
import {HttpResponseInterceptorInterface} from "../interfaces/http-response-interceptor.interface";

@injectable()
export class HttpClient implements HttpClientInterface {
    public defaultOptions: HttpRequestOptions = {
        followRedirects: true,
        maximumNumberOfRedirects: 7,
        isRetryable: (httpRequestInterface, httpResponseInterface) => {
            return httpResponseInterface.status >= 500 && httpResponseInterface.status < 600;
        },
        maximumNumberOfRetries: 3,
        responseType: ResponseTypeEnum.Raw,
    };

    constructor(@injectAll(ServiceDefinitionTagEnum.HttpRequestInterceptor) private readonly httpRequestInterceptors: HttpRequestInterceptorInterface[] = [],
                @injectAll(ServiceDefinitionTagEnum.HttpResponseInterceptor) private readonly httpResponseInterceptors: HttpResponseInterceptorInterface[] = [],
    ) {
    }

    request(request: HttpRequestInterface, options?: HttpRequestOptions): Promise<HttpResponseInterface> {
        return new Promise(async (resolve, reject) => {
            const requestOptions: HttpRequestOptions = assign({}, this.defaultOptions, options);

            // Handle the request by calling the interceptors before actually making the request
            const handledRequest: HttpRequestInterface = await this.handleRequest(request, requestOptions);

            try {
                const response = await this.executeRequest(request);

                return resolve(await this.handleResponse(request, requestOptions, response));
            }
            catch (e) {
                return reject(e); // todo, need to improve this
            }
        });
    }

    /**
     * This method calls the request interceptors in order and returns the intercepted request.
     *
     * @param request
     * @param options
     * @private
     */
    private async handleRequest(request: HttpRequestInterface, options: HttpRequestOptions): Promise<HttpRequestInterface> {
        let interceptedRequest = request;

        for (let httpRequestInterceptor of this.httpRequestInterceptors) {
            interceptedRequest = await httpRequestInterceptor.interceptRequest(interceptedRequest, options);
        }

        return interceptedRequest;
    }

    /**
     *
     * @param request
     * @param requestOptions
     * @param response
     * @private
     */
    private async handleResponse(request: HttpRequestInterface, requestOptions: HttpRequestOptions, response: HttpResponseInterface): Promise<HttpResponseInterface> {
        let interceptedResponse = response;

        interceptedResponse = await this.handleResponseError(request, requestOptions, interceptedResponse);

        interceptedResponse = await this.handleResponseRedirect(request, requestOptions, interceptedResponse);

        // Adjust the response body according to the options.
        switch(requestOptions.responseType) {
            case ResponseTypeEnum.Raw:

                break;
            case ResponseTypeEnum.Json:
                interceptedResponse.body = JSON.parse(interceptedResponse.body);
                break;
        }

        for (let httpResponseInterceptor of this.httpResponseInterceptors) {
            interceptedResponse = await httpResponseInterceptor.interceptResponse(request, requestOptions, interceptedResponse);
        }

        return interceptedResponse;
    }

    private async handleResponseError(request: HttpRequestInterface, requestOptions: HttpRequestOptions, response: HttpResponseInterface, currentRedirectCount = 0): Promise<HttpResponseInterface> {
        let updatedResponse = response;

        // First check to determine if this request should be retried or not, only if the response is an error code
        if(this.isResponseError(updatedResponse) &&
            requestOptions.isRetryable && requestOptions.isRetryable(request, updatedResponse)
        ) {
            if(requestOptions.maximumNumberOfRedirects && requestOptions.maximumNumberOfRedirects <= currentRedirectCount) {
                throw new Error(); // todo output a proper error that we have reached the maximum number of redirects.
            }

            // todo: start a counter, and make sure we are not retrying more often than specified in the options

            // todo: re-execute the executeRequest method until we have success by using an exponential backoff strategy

            // If the request is successful , simply continue the execution.
        }

        return updatedResponse;
    }

    private async handleResponseRedirect(request: HttpRequestInterface, requestOptions: HttpRequestOptions, response: HttpResponseInterface, currentRedirectCount = 0): Promise<HttpResponseInterface> {
        let updatedResponse = response;
        let updatedRequest = request;

        // Check to determine if this requests should be redirected and replayed
        if(this.isResponseRedirect(updatedResponse)) {
            if(requestOptions.maximumNumberOfRedirects && requestOptions.maximumNumberOfRedirects <= currentRedirectCount) {
                throw new Error(); // todo output a proper error that we have reached the maximum number of redirects.
            }

            // todo: Interpret the redirect and call the redirected URL with the same request payload

        }

        return updatedResponse;
    }

    /**
     * This method directly executed the Http or Https request and returns the response.
     * There is no processing done in this method.
     * @param request
     * @private
     */
    private executeRequest(request: HttpRequestInterface): Promise<HttpResponseInterface> {
        return new Promise((resolve, reject) => {
            // Define the options required by the http and https modules.
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

                res.on('end', async () => {
                    response.body = body;

                    return resolve(response);
                });
            }

            // Make the http or https call depending on the url.
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
        })
    }

    private isResponseError(response: HttpResponseInterface) {
        return response.status >= 400 && response.status < 600;
    }

    private isResponseRedirect(response: HttpResponseInterface) {
        return response.status >= 300 && response.status < 400;
    }
}
