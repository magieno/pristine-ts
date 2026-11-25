# HTTP Module

## `KernelHttpServer` request bodies

`KernelHttpServer` reads the request body as bytes and never re-encodes it.

- `request.rawBody` is always the untouched `Buffer`. Use it (or `request.getRawBodyBuffer()`)
  for HMAC signature verification and binary uploads. `rawBody.toString("utf8")` gives the text
  form for callers that need it.
- `request.body` depends on the `Content-Type`:

| `Content-Type` | `request.body` |
| --- | --- |
| `application/json`, any `+json` type | the parsed value (malformed JSON leaves the text) |
| `text/*`, `application/x-www-form-urlencoded`, `application/xml`, `application/javascript`, or any type with a `charset` parameter | the string, decoded with that charset (UTF-8 by default) |
| anything else (`audio/*`, `image/*`, `video/*`, `application/octet-stream`, unknown, none) | the same `Buffer` as `rawBody` |

GET/HEAD requests and zero-length bodies set neither `body` nor `rawBody`.

A handler that accepts an upload takes the body as a `Buffer`:

```ts
@route(HttpMethod.Put, "/files/:id")
async upload(@body() bytes: Buffer, @request() request: Request): Promise<Response> {
  // `bytes` is the exact payload the client sent, byte for byte.
}
```

A handler that returns a `Response` with a `Buffer` body is served through unchanged, with the
`Content-Type` it set. No content type is added for you.

### Maximum body size

`pristine.http.kernel-server.max-body-size` (`HttpConfigurationKeys.KernelServerMaxBodySize`,
env `PRISTINE_HTTP_KERNEL_SERVER_MAX_BODY_SIZE`) caps the request body in bytes. Default 100 MB.
A body over the limit is answered `413 Payload Too Large` and the handler is never called: a
`Content-Length` over the limit is rejected before a byte is read, and a chunked body is cut off
as soon as it passes the limit.

## `KernelHttpServer` remote address

`KernelHttpServer` sets `request.remoteAddress` to the address of the TCP peer
(`socket.remoteAddress`): `127.0.0.1`, `::1` or `::ffff:127.0.0.1` for a caller on the same
machine. It never reads `X-Forwarded-For`, `Forwarded` or any other header, so the caller cannot
forge it.

Use it to keep a route local to the machine:

```ts
const LOOPBACK = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];

@route(HttpMethod.Post, "/admin/pair")
async pair(@request() request: Request): Promise<Response> {
  if (request.remoteAddress === undefined || LOOPBACK.includes(request.remoteAddress) === false) {
    throw new ForbiddenError("This route is only available on this machine.");
  }
  // ...
}
```

Two rules:

- `undefined` means "unknown". Refuse the request; do not treat it as local.
- Behind a reverse proxy the value is the address of the proxy. A proxy on the same host makes
  every caller look like loopback, so this check is only valid when clients connect to
  `KernelHttpServer` directly.
