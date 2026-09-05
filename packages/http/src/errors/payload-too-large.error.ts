import {PristineError} from "@pristine-ts/common";

/**
 * Thrown by `KernelHttpServer` when a request body exceeds the configured
 * `pristine.http.kernel-server.max-body-size`. The server answers `413 Payload Too Large`
 * without dispatching the request to the kernel, so no handler ever sees the body.
 */
export class PayloadTooLargeError extends PristineError {
  public constructor(readonly message: string, readonly maxBodySize: number, readonly receivedBytes?: number) {
    super(message, {
      code: "PAYLOAD_TOO_LARGE",
      httpStatus: 413,
      details: {
        maxBodySize,
        receivedBytes,
      },
    });
  }
}
