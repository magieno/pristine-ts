import {injectable} from "tsyringe";
import {ErrorResponseInterceptorInterface} from "@pristine-ts/core";

@injectable()
export class ErrorResponseInterceptor implements ErrorResponseInterceptorInterface{
    interceptError(error: Error, request: Request, response: Response): Promise<Response> {
        return Promise.resolve(response);
    }

}