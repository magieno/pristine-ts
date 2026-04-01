import {ParameterDecoratorInterface} from "./parameter-decorator.interface";

/**
 * This interface represents the object that will contain the information to know how to handle the
 * @identity decorator.
 */
export interface IdentityParameterDecoratorInterface extends ParameterDecoratorInterface {
  type: "identity";
}
