import {ResponseTypeEnum} from "../enums/response-type.enum";
import {HttpRequestInterface} from "../interfaces/http-request.interface";
import {HttpResponseInterface} from "../interfaces/http-response.interface";

export interface HttpRequestOptions {
    responseType?: ResponseTypeEnum;
    followRedirects?: boolean;
    maximumNumberOfRedirects?: number;
    isRetryable?: ((httpRequestInterface: HttpRequestInterface, httpResponseInterface: HttpResponseInterface) => boolean);
    maximumNumberOfRetries?: number;
}
