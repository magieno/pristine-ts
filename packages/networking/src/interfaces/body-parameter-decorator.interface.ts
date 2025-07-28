import {ParameterDecoratorInterface} from "./parameter-decorator.interface";

/**
 * This interface represents the object that will contain the information to know how to handle the
 * @body decorator.
 */
export interface BodyParameterDecoratorInterface extends ParameterDecoratorInterface {
  type: "body";
}
