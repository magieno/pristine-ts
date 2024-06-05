import {TableDecoratorMetadataInterface} from "../interfaces/table-decorator-metadata.interface";
import {ClassMetadata} from "@pristine-ts/metadata";
import {DecoratorMetadataKeynameEnum} from "../enums/decorator-metadata-keyname.enum";

export const table = (parameters: TableDecoratorMetadataInterface) => {
    return (constructor: any) => {
        ClassMetadata.defineMetadata(constructor, DecoratorMetadataKeynameEnum.Table, parameters);
    };
};