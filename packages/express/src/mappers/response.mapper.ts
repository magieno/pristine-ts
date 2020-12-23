import {Response as ExpressResponse} from "express";
import {injectable} from "tsyringe";
import {Response} from "@pristine-ts/core";

@injectable()
export class ResponseMapper {
    reverseMap(response: Response, expressResponse: ExpressResponse): ExpressResponse {
        expressResponse.status(response.status);

        for (const headersKey in response.headers) {
            if(response.headers.hasOwnProperty(headersKey) === false) {
                continue;
            }

            expressResponse.setHeader(headersKey, response.headers[headersKey]);
        }

        expressResponse.send(response.body);

        return expressResponse;
    }
}