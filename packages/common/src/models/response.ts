/**
 * This Response object represents the class used internally that represents a Response.
 */
import {Request} from "./request";

export class Response {
  /**
   * The status code of the response. By default we return a 200.
   */
  status: number = 200;
  /**
   * The body of the response.
   */
  body?: any;
  /**
   * The request that triggered this response.
   */
  request?: Request;

  /**
   * The headers of the response.
   */
  private _headers: { [key: string]: string } = {};

  /**
   * This method returns all the headers.
   */
  get headers(): { [key: string]: string } {
    return this._headers;
  }

  /**
   * This method sets the headers appropriately.
   *
   * @param headers
   */
  public setHeaders(headers: { [key: string]: string }) {
    for (const name in headers) {
      if (headers.hasOwnProperty(name) === false) {
        continue;
      }

      this.setHeader(name, headers[name])
    }
  }

  /**
   * This method sets a header parameter in the Response.
   *
   * @param name The name of the header.
   * @param value The value of the header.
   */
  public setHeader(name: string, value: string) {
    this.headers[name.toLowerCase()] = value;
  }

  /**
   * This method returns whether or not the header exists in the Response.
   *
   * @param name The name of the header.
   */
  public hasHeader(name: string): boolean {
    return this.headers.hasOwnProperty(name.toLowerCase());
  }

  /**
   * This method returns the header corresponding to the name or undefined if it doesn't exist.
   *
   * @param name The name of the header.
   */
  public getHeader(name: string): string | undefined {
    return this.headers[name.toLowerCase()];
  }
}
