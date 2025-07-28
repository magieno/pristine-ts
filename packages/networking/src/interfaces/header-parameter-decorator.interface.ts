import {ParameterDecoratorInterface} from "./parameter-decorator.interface";

/**
 * This interface represents the object that will contain the information required to know how to handle the
 * @headerParameter decorator.
 */
export interface HeaderParameterDecoratorInterface extends ParameterDecoratorInterface {
  type: "header";
  headerName: string;
}
