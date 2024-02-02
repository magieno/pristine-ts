import {ClassConstructor} from "class-transformer";
import {DataMapper, DataMappingBuilder} from "@pristine-ts/data-mapping";

export interface BodyMappingContextInterface {
    type: "function" | "classType" | "DataMappingBuilder";
}

export interface FunctionBodyMappingContextInterface extends BodyMappingContextInterface {
    type: "function";

    function: ((body: any, dataMapper: DataMapper) => Promise<any>);
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