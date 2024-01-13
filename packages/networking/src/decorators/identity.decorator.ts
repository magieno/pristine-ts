import "reflect-metadata";
import {IdentityParameterDecoratorInterface} from "../interfaces/identity-parameteter-decorator.interface";
import {MetadataUtil} from "@pristine-ts/common";

/**
 * The identity decorator can be used to inject the identity making the request in a parameter of a method in a controller.
 */
export const identity = () => {
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
        const methodParameter: IdentityParameterDecoratorInterface = {
            type: "identity"
        };

        MetadataUtil.setMethodParameterArgumentMetadata(target, propertyKey, parameterIndex, methodParameter);
    }
};
