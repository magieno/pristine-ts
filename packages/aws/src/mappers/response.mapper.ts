import {injectable} from "tsyringe";
import {Response} from "@pristine-ts/networking";
import {ApiGatewayResponseModel} from "../models/api-gateway-response.model";

@injectable()
export class ResponseMapper {
    reverseMap(response: Response): ApiGatewayResponseModel {
        const apiGatewayResponse = new ApiGatewayResponseModel();
        apiGatewayResponse.statusCode = response.status;

        apiGatewayResponse.headers = response.headers;
        if(!apiGatewayResponse.headers) {
            apiGatewayResponse.headers = {};
        }
        if(apiGatewayResponse.headers.hasOwnProperty("Content-Type") === false){
            apiGatewayResponse.headers["Content-Type"] = "application/json";
        }
        apiGatewayResponse.isBase64Encoded = false;

        if(typeof response.body === "string"){
            apiGatewayResponse.body = response.body;
        } else if(typeof response.body === "object"){
            apiGatewayResponse.body = JSON.stringify(response.body);
        }

        return apiGatewayResponse;
    }
}
