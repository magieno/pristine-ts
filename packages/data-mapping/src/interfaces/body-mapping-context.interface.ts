import {DataMappingBuilder} from "../builders/data-mapping.builder";
import {ClassConstructor} from "class-transformer";

export interface BodyMappingContextInterface {
    type: "function" | "classType" | "DataMappingBuilder";
}

export interface FunctionBodyMappingContextInterface extends BodyMappingContextInterface {
    type: "function";

    function: ((body: any) => any);
}

export interface ClassTransformerBodyMappingContextInterface extends BodyMappingContextInterface {
    type: "classType";

    classType: ClassConstructor<any>;
}
export interface DataMappingBuilderBodyMappingContextInterface extends BodyMappingContextInterface {
    type: "DataMappingBuilder";

    dataMappingBuilder: DataMappingBuilder;
    destination?: ClassConstructor<any>;
}