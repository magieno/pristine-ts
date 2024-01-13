import {BodyParameterDecoratorInterface} from "../interfaces/body-parameter-decorator.interface";
import {MetadataUtil} from "@pristine-ts/common";

/**
 * The body decorator can be used to inject the body of a request in a parameter of a method in a controller.
 */
export const body = () => {
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
        const methodParameter: BodyParameterDecoratorInterface = {
            type: "body"
        };

        MetadataUtil.setMethodParameterArgumentMetadata(target, propertyKey, parameterIndex, methodParameter);
    }
};

