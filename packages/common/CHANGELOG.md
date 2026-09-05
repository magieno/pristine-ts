# Changelog — @pristine-ts/common

## 4.0.12

- **`Request.rawBody` is typed `Buffer | string | undefined`** (it was `any`). A `Buffer` when
  the adapter had the bytes (`KernelHttpServer` in `@pristine-ts/http`, the Express mapper with
  the `RawBodyCapture` hook), a `string` when the platform only hands over text (API Gateway,
  Cloud Functions), `undefined` when there was no body. Never the parsed object.

- **New `Request.getRawBodyBuffer()`**: the raw body as bytes, a `Buffer` as is, a `string`
  encoded as UTF-8, `undefined` when there is none. Use it for anything that must see the exact
  bytes on the wire: HMAC signature verification, binary uploads.
