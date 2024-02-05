import {ArrayMemberTypeFactoryCallbackType} from "../types/array-member-type-factory-callback.type";
import {MetadataEnum} from "../enums/metadata.enum";
import {PropertyMetadata, PropertyInformationEnum}  from "@pristine-ts/metadata"
/**
 * This decorator can be used to specify that a property is nullable. This data
 * is currently not available out of the box so it needs to be manually specified.
 */
export const array = (dataType: any | ArrayMemberTypeFactoryCallbackType) => {
    return (target: any, propertyKey: string | symbol) => {
        if(dataType) {
            // if the dataType is a function, then it's a factory callback so we store it with a different key.
            if(typeof dataType === "function") {
                PropertyMetadata.defineMetadata(target, propertyKey, MetadataEnum.ArrayMemberTypeFactory, dataType);
            } else {
                PropertyMetadata.defineMetadata(target, propertyKey, PropertyInformationEnum.ArrayMemberType, dataType);
            }
        }

        PropertyMetadata.propertySeen(target, propertyKey);
    };
}