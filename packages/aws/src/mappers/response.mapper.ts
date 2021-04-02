import {injectable} from "tsyringe";
import {Response} from "@pristine-ts/networking";
import {ApiGatewayResponseModel} from "../models/api-gateway-response.model";

@injectable()
export class ResponseMapper {
    reverseMap(response: Response): ApiGatewayResponseModel {
        const apiGatewayResponse = new ApiGatewayResponseModel();
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
