import {ParameterDecoratorInterface} from "./parameter-decorator.interface";

/**
 * This interface represents the object that will contain the information to know how to handle the
 * @headers decorator.
 */
export interface HeadersParameterDecoratorInterface extends ParameterDecoratorInterface {
  type: "headers";
}
