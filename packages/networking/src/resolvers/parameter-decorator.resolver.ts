import {BodyParameterDecoratorInterface} from "../interfaces/body-parameteter-decorator.interface";
import {QueryParameterDecoratorInterface} from "../interfaces/query-parameter-decorator.interface";
import {QueryParametersDecoratorInterface} from "../interfaces/query-parameters-decorator.interface";
import {RouteParameterDecoratorInterface} from "../interfaces/route-parameter-decorator.interface";
import {Request} from "../models/request";

const Url = require('url-parse');

/**
 * This resolver class receives a method argument, the request object and a list of route parameters and return the
 * value that should be passed to the parameter decorator. For example, if the method as the @body decorator, you want to
 * take the request and return the body.
 */
export class ParameterDecoratorResolver {
    public static resolve(methodArgument: BodyParameterDecoratorInterface | QueryParameterDecoratorInterface | QueryParametersDecoratorInterface | RouteParameterDecoratorInterface,
                          request: Request,
                          routeParameters: { [key: string]: string }): any {
        const url = new Url(request.url, true);

        switch (methodArgument.type) {
            case "body":
                return request.body ?? null;

            case "routeParameter":
                return routeParameters[methodArgument.routeParameterName] ?? null;

            case "queryParameter":
                return url.query[methodArgument.queryParameterName] ?? null;

            case "queryParameters":
                return url.query ?? null;
        }
    }
}