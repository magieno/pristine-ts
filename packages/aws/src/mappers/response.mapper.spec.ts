import "reflect-metadata"
import {Response} from "@pristine-ts/networking";
import {ResponseMapper} from "./response.mapper";
import {ApiGatewayResponseModel} from "../models/api-gateway-response.model";

describe("Response mapper", () => {

    it("should map a response properly", () => {
        const responseMapper = new ResponseMapper();

        const response: Response = new Response();
        response.body = {
            TotalCodeSize: 104330022,
            FunctionCount: 26
        };
        response.status = 200

        const expectedResponse: ApiGatewayResponseModel = {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "isBase64Encoded": false,
            "body": "{\"TotalCodeSize\":104330022,\"FunctionCount\":26}"
        };

        expect(responseMapper.reverseMap(response)).toEqual(expectedResponse);
    })

    it("should map a response with error properly", () => {
        const responseMapper = new ResponseMapper();

        const response: Response = new Response();
        response.body = "400: Not found"
        response.status = 400

        const expectedResponse: ApiGatewayResponseModel = {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
            },
            "isBase64Encoded": false,
            "body": "400: Not found"
        };

        expect(responseMapper.reverseMap(response)).toEqual(expectedResponse);
    })
})
