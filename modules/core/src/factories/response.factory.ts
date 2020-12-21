import {Response} from "../network/response";
import {HttpError} from "../errors/http.error";

export class ResponseFactory {
    create(res: any): Response {
        const response: Response = {}

        return response;
    }

    createFromError(error: Error): Response {
        if(error instanceof HttpError) {
            return {
                status: error.httpStatus,
                body: {
                    message
                }
            };
        }
    }
}