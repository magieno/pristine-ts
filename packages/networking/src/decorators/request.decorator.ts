import "reflect-metadata";
import {RequestParameterDecoratorInterface} from "../interfaces/request-parameter-decorator.interface";
import {MetadataUtil} from "@pristine-ts/common";

/**
 * The request decorator can be used to inject the whole request in a parameter of a method in a controller.
 */
export const request = () => {
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
        const methodParameter: RequestParameterDecoratorInterface = {
            type: "request"
        };

        MetadataUtil.setMethodParameterArgumentMetadata(target, propertyKey, parameterIndex, methodParameter);
    }
};

