import {MetadataUtil} from "@pristine-ts/common";
import {DataMappingBuilder} from "../../../data-mapping/src/builders/data-mapping.builder";
import {
    ClassTransformerBodyMappingContextInterface, DataMappingBuilderBodyMappingContextInterface,
    FunctionBodyMappingContextInterface
} from "../interfaces/body-mapping-context.interface";
import {ClassConstructor} from "class-transformer";

export const bodyMappingDecoratorMetadataKeyname = "@bodyMappingDecorator";

/**
 * The bodyMapping decorator can be used to map the body to another object.
 */
export const bodyMapping = (argument: ClassConstructor<any> | {builder: DataMappingBuilder, destination?: ClassConstructor<any>} | ((body: any) => any) ) => {
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
         * The descriptor of the property.
         */
        descriptor: PropertyDescriptor
    ) => {
        let context: ClassTransformerBodyMappingContextInterface | FunctionBodyMappingContextInterface | DataMappingBuilderBodyMappingContextInterface;


        if(argument.hasOwnProperty("builder")) {
            context = {
                type: "DataMappingBuilder",

                // @ts-ignore It will exist if it has the property above.
                dataMappingBuilder: argument.builder as DataMappingBuilder,

                // @ts-ignore If it doesn't exist, it shouldn't worry about it, but it does...
                destination: argument.destination ?? undefined,
            }
        } else if(typeof argument === "function" && argument.hasOwnProperty("prototype") && argument.prototype.hasOwnProperty("constructor")) {
            context = {
                type: "classType",
                classType: argument as ClassConstructor<any>,
            }
        } else {
            context = {
                type: "function",
                function: argument as ((body: any) => any),
            }
        }

        MetadataUtil.setToRouteContext(bodyMappingDecoratorMetadataKeyname, context, target, propertyKey);
    }
}
