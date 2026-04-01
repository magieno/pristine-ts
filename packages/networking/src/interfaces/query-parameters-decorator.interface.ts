import {ParameterDecoratorInterface} from "./parameter-decorator.interface";

/**
 * This interface represents the object that will contain the information required to know how to handle the
 * @queryParameters decorator.
 */
export interface QueryParametersDecoratorInterface extends ParameterDecoratorInterface {
  type: "queryParameters";
}
