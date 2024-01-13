import "reflect-metadata";
import {QueryParametersDecoratorInterface} from "../interfaces/query-parameters-decorator.interface";
import {MetadataUtil} from "@pristine-ts/common";

/**
 * The queryParameters decorator can be used to inject all the query parameters of a request in a parameter of a method in a controller.
 */
export const queryParameters = () => {
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
        const methodParameter: QueryParametersDecoratorInterface = {
            type: "queryParameters",
        };

        MetadataUtil.setMethodParameterArgumentMetadata(target, propertyKey, parameterIndex, methodParameter);
    }
}
