import "reflect-metadata";
import {RouteParameterDecoratorInterface} from "../interfaces/route-parameter-decorator.interface";
import {MetadataUtil} from "@pristine-ts/common"

/**
 * The routeParameter decorator can be used to inject a specific route parameter of a request in a parameter of a method in a controller.
 * @param name The name of the route(path) parameter to inject.
 */
export const routeParameter = (name: string) => {
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
    const methodParameter: RouteParameterDecoratorInterface = {
      type: "routeParameter",
      routeParameterName: name,
    };

    MetadataUtil.setMethodParameterArgumentMetadata(target, propertyKey, parameterIndex, methodParameter);
  }
}
