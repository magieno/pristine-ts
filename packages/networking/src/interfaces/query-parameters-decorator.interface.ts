import {ParameterDecoratorInterface} from "./parameter-decorator.interface";

export interface QueryParametersDecoratorInterface extends ParameterDecoratorInterface {
    type: "queryParameters";
}
