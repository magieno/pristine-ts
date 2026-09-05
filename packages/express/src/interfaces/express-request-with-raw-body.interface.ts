import {Request as ExpressRequest} from "express";

/**
 * An Express request on which the raw request bytes were captured before body parsing.
 * `RawBodyCapture.verify` stores them on `rawBody`; `RequestMapper` reads them from there.
 */
export interface ExpressRequestWithRawBody extends ExpressRequest {
  rawBody?: Buffer;
}
