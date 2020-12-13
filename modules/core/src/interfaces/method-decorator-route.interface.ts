import {HttpMethod} from "../enums/http-method.enum";

export interface MethodDecoratorRoute {
    httpMethod: HttpMethod | string;
    propertyKey: string;
    path: string;
}