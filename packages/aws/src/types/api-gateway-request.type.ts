import {HttpRequestModel} from "../models/http-request.model";
import {RestApiRequestModel} from "../models/rest-api-request.model";

/**
 * The Api gateway request type representing both the Rest Api request (Version 1.0) and the Http Request (Version 2.0).
 */
export type ApiGatewayRequest = HttpRequestModel | RestApiRequestModel;
