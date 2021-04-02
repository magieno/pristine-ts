import {injectable} from "tsyringe";
import {Response} from "@pristine-ts/networking";
import {ApiGatewayResponse} from "../models/api-gateway-response";

@injectable()
export class ResponseMapper {
    reverseMap(response: Response): ApiGatewayResponse {
        const apiGatewayResponse = new ApiGatewayResponse();
        apiGatewayResponse.statusCode = response.status;

        apiGatewayResponse.headers = response.headers;
        apiGatewayResponse.isBase64Encoded = false;

        if(typeof response.body === "string"){
            apiGatewayResponse.body = response.body;
        } else {
            apiGatewayResponse.body = JSON.stringify(response.body);
        }

        return apiGatewayResponse;
    }
}
