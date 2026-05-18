import {PristineError, Request} from "@pristine-ts/common";

/**
 * This Error is thrown when there's an error that happens while handling a request.
 */
export class RequestHandlingError extends PristineError {

  public constructor(message: string, request: Request) {
    super(message, {details: {
      request,
    }});  }
}
