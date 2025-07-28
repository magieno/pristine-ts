import {HttpMethod} from "@pristine-ts/common";

/**
 * This interface represents the object that will contain the information required to know how to handle the
 * @route decorator inside the Controller.
 */
export interface RouteMethodDecorator {
  /**
   * This represents the HttpMethod that is allowed. Ex: if you set Get, the controller method will only be reachable
   * if the request is a GET Request.
   */
  httpMethod: HttpMethod | string;

  /**
   * The methodKeyname represents the name of the Controller's method as a string. This is saved to know which method to call
   * when a request comes in.
   */
  methodKeyname: string;

  /**
   * The path is simply the path at which the method will be reached. Ex: /api/2.0/dogs/{id}/puppies
   */
  path: string;
}
