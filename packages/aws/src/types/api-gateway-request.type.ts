import {HttpRequestModel} from "../models/http-request.model";
import {RestApiRequestModel} from "../models/rest-api-request.model";


export type ApiGatewayRequest = HttpRequestModel | RestApiRequestModel;
