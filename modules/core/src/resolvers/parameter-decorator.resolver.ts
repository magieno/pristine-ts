import {BodyParameterDecoratorInterface} from "../interfaces/body-parameteter-decorator.interface";
import {QueryParameterDecoratorInterface} from "../interfaces/query-parameter.decorator";
import {QueryParametersDecoratorInterface} from "../interfaces/query-parameters-decorator.interface";
import {RouteParameterDecoratorInterface} from "../interfaces/route-parameter-decorator.interface";
import {Request} from "../network/request";
const Url = require('url-parse');

export class ParameterDecoratorResolver {
    public static resolve(methodArgument: BodyParameterDecoratorInterface | QueryParameterDecoratorInterface | QueryParametersDecoratorInterface | RouteParameterDecoratorInterface, request: Request, routeParameters: { [key: string]: string }): any {
        const url = new Url(request.url, true);

        switch (methodArgument.type) {
            case "body":
                return request.body;

            case "routeParam":
                return routeParameters[methodArgument.routeParameterName];

            case "queryParam":
                return url.query[methodArgument.queryParameterName];

            case "queryParams":
                return url.query;
        }
    }
}