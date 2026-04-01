import {ParameterDecoratorInterface} from "./parameter-decorator.interface";

/**
 * This interface represents the object that will contain the information required to know how to handle the
 * @queryParameter decorator.
 */
export interface QueryParameterDecoratorInterface extends ParameterDecoratorInterface {
  type: "queryParameter";
  queryParameterName: string;
}
