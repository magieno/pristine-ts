import {ArrayMemberTypeFactoryCallbackType} from "../types/array-member-type-factory-callback.type";
import {MetadataEnum} from "../enums/metadata.enum";
import {PropertyMetadata, PropertyInformationEnum}  from "@pristine-ts/metadata"

export const array = (dataType: any | ArrayMemberTypeFactoryCallbackType) => {
    return (target: any, propertyKey: string | symbol) => {
        if(dataType) {
            // if the dataType is a function, then it's a factory callback so we store it with a different key.
            if(typeof dataType === 'function' && !dataType.prototype) {
                PropertyMetadata.defineMetadata(target, propertyKey, MetadataEnum.ArrayMemberTypeFactory, dataType);
            } else {
                PropertyMetadata.defineMetadata(target, propertyKey, PropertyInformationEnum.ArrayMemberType, dataType);
            }
        }

        PropertyMetadata.propertySeen(target, propertyKey);
    };
}