import {HttpRequestModel} from "../models/http-request";
import {RestApiRequestModel} from "../models/rest-api-request";

export type ApiGatewayRequest = HttpRequestModel | RestApiRequestModel;
