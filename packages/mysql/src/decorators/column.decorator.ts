import {PropertyMetadata} from "@pristine-ts/metadata";
import {ColumnDecoratorMetadataInterface} from "../interfaces/column-decorator-metadata.interface";
import {DecoratorMetadataKeynameEnum} from "../enums/decorator-metadata-keyname.enum";

export const column = (element?: ColumnDecoratorMetadataInterface) => {
    return (target: any, propertyKey: string) => {

        if(!element) {
            element = {};
        }

        if(element?.isSearchable === undefined) {
            // Default value is true for isSearchable.
            element.isSearchable = true;
        }

        PropertyMetadata.defineMetadata(target, propertyKey, DecoratorMetadataKeynameEnum.Column, element ?? {})
    }
};
