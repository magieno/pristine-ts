import {HttpRequest} from "../models/http-request";
import {RestApiRequest} from "../models/rest-api-request";

export type ApiGatewayRequest = HttpRequest | RestApiRequest;
