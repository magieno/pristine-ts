import {PropertyMetadata} from "@pristine-ts/metadata";
import {MetadataEnum} from "../enums/metadata.enum";
import {TypeFactoryCallback} from "../types/type-factory-callback.type";


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
