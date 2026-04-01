import {HttpMethod} from "@pristine-ts/common";

/**
 * This interface defines what is an http request.
 */
export interface HttpRequestInterface {
  /**
   * The http method to use when making the request.
   */
  httpMethod: string | HttpMethod;

  /**
   * The url where to make the request.
   */
  url: string;

  /**
   * The headers of the request.
   */
  headers?: { [key: string]: string };

  /**
   * The body of the request.
   */
  body?: string | Buffer | Uint8Array;
}
