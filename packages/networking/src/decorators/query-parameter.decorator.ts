import "reflect-metadata";
import {QueryParameterDecoratorInterface} from "../interfaces/query-parameter-decorator.interface";
import {MetadataUtil} from "@pristine-ts/common";

/**
 * The queryParameter decorator can be used to inject a specific query parameter of a request in a parameter of a method in a controller.
 * @param name The name of the query parameter to inject.
 */
export const queryParameter = (name: string) => {
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
        // Set also the name of the query parameter to resolve.
        const methodParameter: QueryParameterDecoratorInterface = {
            type: "queryParameter",
            queryParameterName: name,
        };

        MetadataUtil.setMethodParameterArgumentMetadata(target, propertyKey, parameterIndex, methodParameter);
    }
}
