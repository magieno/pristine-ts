import "reflect-metadata";
import {HeadersParameterDecoratorInterface} from "../interfaces/headers-parameter-decorator.interface";
import {MetadataUtil} from "@pristine-ts/common";

/**
 * The headers decorator can be used to inject the headers of a request in a parameter of a method in a controller.
 */
export const headers = () => {
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
    const methodParameter: HeadersParameterDecoratorInterface = {
      type: "headers"
    };

    MetadataUtil.setMethodParameterArgumentMetadata(target, propertyKey, parameterIndex, methodParameter);
  }
};

