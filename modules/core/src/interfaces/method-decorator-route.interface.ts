import {HttpMethod} from "../enums/http-method.enum";

export interface MethodDecoratorRoute {
    method: HttpMethod;
    propertyKey: string;
    path: string;
}