import "reflect-metadata";
import {HeaderParameterDecoratorInterface} from "../interfaces/header-parameter-decorator.interface";
import {MetadataUtil} from "@pristine-ts/common";

/**
 * The headerParameter decorator can be used to inject a specific header of a request in a parameter of a method in a controller.
 * @param name The name of the header to inject.
 */
export const header = (name: string) => {
  return (
    /**
     * The class on which the decorator is used.
     */
    target: any,
    /**
     * The method on which the decorator is used.
     */
    propertyKey: string | symbol,
    /**
     * The index of the parameter for which the decorator is used.
     */
    parameterIndex: number
  ) => {
    // Set the type of method parameter. Each parameter decorator has it's own type.
    // Set also the name of the header to resolve.
    const methodParameter: HeaderParameterDecoratorInterface = {
      type: "header",
      headerName: name,
    };

    MetadataUtil.setMethodParameterArgumentMetadata(target, propertyKey, parameterIndex, methodParameter);
  }
}
