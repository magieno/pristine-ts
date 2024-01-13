import {JwtPayloadDecoratorInterface} from "../interfaces/jwt-payload-decorator.interface";
import {MetadataUtil} from "@pristine-ts/common";

/**
 * This decorator can be used to inject the decoded JWT payload of a request in a parameter of a method in a controller.
 */
export const jwtPayload = () => {
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
        // Set the type of method parameter. Each decorator has it's own type.
        const methodParameter: JwtPayloadDecoratorInterface = {
            type: "jwtPayload"
        };

        MetadataUtil.setMethodParameterArgumentMetadata(target, propertyKey, parameterIndex, methodParameter);
    }
};
