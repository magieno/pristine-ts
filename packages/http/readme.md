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
