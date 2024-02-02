import {PropertyMetadata} from "@pristine-ts/metadata";
import {MetadataEnum} from "@pristine-ts/common";

export type TypeFactoryCallback = (target: any, propertyKey: string) => any;

export const type = (callback: TypeFactoryCallback) => {
    return (
        /**
         * The class on which the decorator is used.
         */
        target: any,

        /**
         * The property on which the decorator is used.
         */
        propertyKey: string | symbol
    ) => {
        PropertyMetadata.defineMetadata(target, propertyKey, MetadataEnum.TypeFactory, callback);
    }
}
