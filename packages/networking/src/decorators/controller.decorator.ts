import "reflect-metadata";
import {ClassMetadata} from "@pristine-ts/metadata";
import {MetadataEnum} from "@pristine-ts/common"

export const controllerRegistry: any[] = [];

/**
 * The controller decorator can be used on a class to register this class as a controller in the router.
 * @param basePath The base path for all the routes in the controller.
 */
export const controller = (basePath: string) => {
  return (
    /**
     * The constructor of the class
     */
    constructor: Function
  ) => {
    ClassMetadata.defineMetadata(constructor, MetadataEnum.ControllerBasePath, basePath)

    // Push the class prototype in the controllerRegistry that is used to instantiate all the controllers for the router.
    controllerRegistry.push(constructor)
  }
}
