import {MetadataUtil} from "@pristine-ts/common";

export const bodyValidationMetadataKeyname = "@bodyValidation";

/**
 * The bodyValidation decorator can be used to validate the body of a request.
 * @param classType The class that the request body is expected to fit.
 */
export const bodyValidation = (classType: Function) => {
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
    MetadataUtil.setToRouteContext(bodyValidationMetadataKeyname, {
      classType,
    }, target, propertyKey);
  }
}

