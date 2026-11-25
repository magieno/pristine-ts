# Changelog — @pristine-ts/common

## 4.0.21

- **New optional `Request.remoteAddress`**: the address of the directly connected network peer,
  as the transport saw it (for example `127.0.0.1`, `::1` or `::ffff:127.0.0.1`). It is never
  taken from a header (`X-Forwarded-For`, `Forwarded`, `X-Real-IP`), so a caller cannot forge it.
  Behind a reverse proxy or a load balancer it is the address of that proxy.

  Who sets it:
  - `KernelHttpServer` (`@pristine-ts/http`) and the Express `RequestMapper`
    (`@pristine-ts/express`): `socket.remoteAddress`, the TCP peer of the Node server.
  - `RestApiEventMapper` and `HttpApiEventMapper` (`@pristine-ts/aws-api-gateway`, `Request`
    handling strategy): the `sourceIp` of the API Gateway request context
    (`requestContext.identity.sourceIp` / `requestContext.http.sourceIp`). API Gateway sets it
    itself: it is the source address of the TCP connection to the API Gateway endpoint.
  - Everything else leaves it `undefined` (`@pristine-ts/gcp-functions`, a `Request` built by
    hand). Treat `undefined` as "unknown", never as "local".

  Backward compatible: the property is optional and the constructor is unchanged.

## 4.0.12

- **`Request.rawBody` is typed `Buffer | string | undefined`** (it was `any`). A `Buffer` when
  the adapter had the bytes (`KernelHttpServer` in `@pristine-ts/http`, the Express mapper with
  the `RawBodyCapture` hook), a `string` when the platform only hands over text (API Gateway,
  Cloud Functions), `undefined` when there was no body. Never the parsed object.

- **New `Request.getRawBodyBuffer()`**: the raw body as bytes, a `Buffer` as is, a `string`
  encoded as UTF-8, `undefined` when there is none. Use it for anything that must see the exact
  bytes on the wire: HMAC signature verification, binary uploads.
