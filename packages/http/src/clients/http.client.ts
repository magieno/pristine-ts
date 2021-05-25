import {inject, injectable, injectAll} from "tsyringe";
import {HttpClientInterface} from "../interfaces/http-client.interface";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpResponseInterface} from "../interfaces/http-response.interface";
import * as http from "http";
import {IncomingMessage, request as httpRequest, RequestOptions} from "http";
import {request as httpsRequest} from "https";
import Url from 'url-parse';
import {ResponseTypeEnum} from "../enums/response-type.enum";
import {HttpRequestOptions} from "../options/http-request.options.";
import {assign} from "lodash";
import {ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {HttpRequestInterceptorInterface} from "../interfaces/http-request-interceptor.interface";
import {HttpResponseInterceptorInterface} from "../interfaces/http-response-interceptor.interface";
import {MathUtils} from "../utils/math.utils";
import URLParse from "url-parse";
import {HttpClientResponseRedirectError} from "../errors/http-client-response-redirect.error";
import {HttpClientRequestError} from "../errors/http-client-request.error";

@injectable()
export class HttpClient implements HttpClientInterface {
    public defaultOptions: HttpRequestOptions = {
        followRedirects: true,
        maximumNumberOfRedirects: 5,
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

    /**
     * This method is the entry point where the request is passed as an argument and the response is retured.
     *
     * @param request
     * @param options
     */
    async request(request: HttpRequestInterface, options?: HttpRequestOptions): Promise<HttpResponseInterface> {
        const requestOptions: HttpRequestOptions = assign({}, this.defaultOptions, options);

        // Handle the request by calling the interceptors before actually making the request
        const handledRequest: HttpRequestInterface = await this.handleRequest(request, requestOptions);

        try {
            const response = await this.executeRequest(handledRequest);

            return this.handleResponse(handledRequest, requestOptions, response);
        } catch (e) {
            throw e; // todo, need to improve this
        }
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
     * This method handles the response by:
     * - calling the handleResponseError to retry if it can
     * - calling the handleResponseRedirect to follow the redirect if necessary and conditions are met
     * - converting the response body
     * - calling the response interceptors
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
        switch (requestOptions.responseType) {
            case ResponseTypeEnum.Raw:

                break;
            case ResponseTypeEnum.Json:
                try {
                    interceptedResponse.body = JSON.parse(interceptedResponse.body);
                } catch (e) {
                }

                break;
        }

        for (let httpResponseInterceptor of this.httpResponseInterceptors) {
            interceptedResponse = await httpResponseInterceptor.interceptResponse(request, requestOptions, interceptedResponse);
        }

        return interceptedResponse;
    }

    /**
     * This method checks if the response is an error. If it is, it checks to see if this request can be retried and if
     * it can, will retry it. It will also check that we haven't reached the maximum number of retries. It will also apply
     * exponential backoff and jitter.
     * @param request
     * @param requestOptions
     * @param response
     * @param currentRetryCount
     * @private
     */
    private async handleResponseError(request: HttpRequestInterface, requestOptions: HttpRequestOptions, response: HttpResponseInterface, currentRetryCount = 0): Promise<HttpResponseInterface> {
        let updatedResponse = response;

        // First check to determine if this request should be retried or not, only if the response is an error code
        if (this.isResponseError(updatedResponse) &&
            requestOptions.isRetryable && requestOptions.isRetryable(request, updatedResponse)
        ) {
            if (requestOptions.maximumNumberOfRetries && requestOptions.maximumNumberOfRetries <= currentRetryCount) {
                // Simply return the errored out response.
                return updatedResponse;
            }

            const updatedRetryCount = ++currentRetryCount;

            // Retry the request using an exponential backoff with jitter.
            updatedResponse = await new Promise<HttpResponseInterface>(resolve => setTimeout(async () => {
                return resolve(await this.executeRequest(request));
            }, MathUtils.exponentialBackoffWithJitter(updatedRetryCount)))


            return this.handleResponseError(request, requestOptions, updatedResponse, updatedRetryCount);
        }

        return updatedResponse;
    }

    /**
     * This method follows the redirects the server returns an HTTP with status 3xx.
     * @param request
     * @param requestOptions
     * @param response
     * @param currentRedirectCount
     * @private
     */
    private async handleResponseRedirect(request: HttpRequestInterface, requestOptions: HttpRequestOptions, response: HttpResponseInterface, currentRedirectCount = 0): Promise<HttpResponseInterface> {
        let updatedResponse = response;

        // Check to determine if this requests should be redirected and replayed
        if (this.isResponseRedirect(updatedResponse) && requestOptions.followRedirects) {
            if (requestOptions.maximumNumberOfRedirects && requestOptions.maximumNumberOfRedirects <= currentRedirectCount) {
                throw new HttpClientResponseRedirectError("Error making the HTTP Request, the maximum number of redirects has been reached", request, requestOptions, response, currentRedirectCount); // todo: output a proper error that we have reached the maximum number of redirects.
            }

            // todo: Interpret the redirect and call the redirected URL with the same request payload
            if (response.headers === undefined || response.headers.location === undefined) {
                throw new HttpClientResponseRedirectError("The http response headers doesn't contain the location header which makes it impossible to follow the redirect.", request, requestOptions, response, currentRedirectCount); // todo: output a proper error that we have reached the maximum number of redirects.
            }

            const updatedRequest = request;

            // Updated the URL by using the 'location' header returned by the response.
            const url = new Url(request.url, true);
            url.set("pathname", response.headers.location);

            updatedRequest.url = url.toString()

            const updatedRedirectCount = ++currentRedirectCount;

            // Retry the request using an exponential backoff with jitter.
            updatedResponse = await this.executeRequest(updatedRequest)

            // This updated response could be an error, check to see if it is and handle it.
            if (this.isResponseError(updatedResponse)) {
                updatedResponse = await this.handleResponseError(updatedRequest, requestOptions, updatedResponse);
            }

            return this.handleResponseRedirect(updatedRequest, requestOptions, updatedResponse, updatedRedirectCount);
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
                path: url.pathname + ((url.query === {}) ? "" : "?" + Object.keys(url.query).map(key => key + "=" + url.query).join("&")),
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

    private isResponseError(response: HttpResponseInterface) {
        return response.status >= 400 && response.status < 600;
    }

    private isResponseRedirect(response: HttpResponseInterface) {
        return response.status >= 300 && response.status < 400;
    }
}
