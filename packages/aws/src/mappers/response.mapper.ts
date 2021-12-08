import {injectable, inject} from "tsyringe";
import {Response} from "@pristine-ts/networking";
import {ApiGatewayResponseModel} from "../models/api-gateway-response.model";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {AwsModuleKeyname} from "../aws.module.keyname";

@injectable()
export class ResponseMapper {
    constructor( @inject("LogHandlerInterface") private readonly loghandler: LogHandlerInterface) {
    }

    /**
     * Reverse maps a Pristine response to an Api gateway response.
     * @param response The Pristine response.
     */
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

        this.loghandler.debug("Reverse mapping the response into a 'ApiGatewayResponseModel'.", {
            response,
            apiGatewayResponse,
        }, AwsModuleKeyname)

        return apiGatewayResponse;
    }
}
