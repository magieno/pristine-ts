# @pristine-ts/http

The HTTP surface for Pristine. It wears two hats:

- an **outgoing HTTP client** (`HttpClient`) — an injectable, interceptable, retry-aware wrapper
  for calling other services; and
- an **inbound HTTP server** (`KernelHttpServer`) — the runtime that `pristine start` binds so a
  real Node `http`/`https` socket feeds straight into the kernel's event pipeline, routing through
  the controllers you already declare with `@pristine-ts/networking`.

Because the server routes through `kernel.handle()` — not a bootstrapped Express/Fastify instance —
there is no second HTTP stack inside your process. The same app runs unchanged behind AWS API
Gateway (via `@pristine-ts/aws-api-gateway`), a Cloudflare Worker, or this server.

## Installation

```bash
npm install @pristine-ts/http
```

Import the module into your application module:

```typescript
import {AppModuleInterface} from "@pristine-ts/common";
import {HttpModule} from "@pristine-ts/http";

export const AppModule: AppModuleInterface = {
  keyname: "app",
  importModules: [
    HttpModule,
    // ...your controllers' module(s)
  ],
  providerRegistrations: [],
};
```

`HttpModule` pulls in only the framework modules its request pipeline needs (`Core`, `DataMapping`,
`Logging`, `Observability`, `Validation`) — **not** `@pristine-ts/cli`, so it stays light in
HTTP/Lambda runtimes and ESM bundles.

## The HTTP client

`HttpClient` (tagged `"HttpClientInterface"`) makes outgoing requests. Inject it by class or token
and call `request()` with an `HttpRequestInterface`; the response is parsed according to
`options.responseType`.

```typescript
import {injectable, inject} from "tsyringe";
import {HttpClientInterface, ResponseTypeEnum} from "@pristine-ts/http";
import {HttpMethod} from "@pristine-ts/common";

@injectable()
export class WeatherClient {
  constructor(@inject("HttpClientInterface") private readonly httpClient: HttpClientInterface) {}

  async getForecast(city: string) {
    const response = await this.httpClient.request(
      {
        httpMethod: HttpMethod.Get,
        url: `https://example.com/forecast?city=${encodeURIComponent(city)}`,
        headers: {"accept": "application/json"},
      },
      {
        responseType: ResponseTypeEnum.Json,
        followRedirects: true,
        maximumNumberOfRedirects: 5,
        maximumNumberOfRetries: 3,
        isRetryable: (_req, res) => res.status >= 500,   // retry on 5xx only
      },
    );

    return response.body;
  }
}
```

- **Interceptors** — tag a class `ServiceDefinitionTagEnum.HttpRequestInterceptor`,
  `HttpResponseInterceptor`, or `HttpErrorResponseInterceptor` to observe/mutate outgoing requests
  and their responses (auth headers, logging, custom retry). Ordering is by a `priority` property
  on the class, per the framework contract.
- **Retries** — `isRetryable` + `maximumNumberOfRetries` re-issue a request when the predicate
  returns `true`.
- **Redirects** — `followRedirects` / `maximumNumberOfRedirects` control redirect chasing.

## Serving HTTP with `KernelHttpServer`

`KernelHttpServer` is a `RuntimeServerInterface` (tagged `ServiceDefinitionTagEnum.RuntimeServer`),
so **`pristine start` starts it and stops it on graceful shutdown** alongside any other runtime
servers (e.g. `@pristine-ts/local-scheduling`). You don't instantiate it yourself — you declare
controllers and run `pristine start`:

```typescript
import {injectable} from "tsyringe";
import {controller, route} from "@pristine-ts/networking";
import {HttpMethod} from "@pristine-ts/common";

@controller("/widgets")
@injectable()
export class WidgetsController {
  @route(HttpMethod.Get, "")
  async list() {
    return {widgets: []};   // plain objects are serialized to JSON with a 200
  }
}
```

```bash
pristine start                 # binds the server, routes /widgets to the controller
pristine start --port 8080     # --port / --address override the configured bind
```

- **Binding** — `pristine.http.kernel-server.address` (default `0.0.0.0`) and
  `pristine.http.kernel-server.port` (default `3000`). Bind to `127.0.0.1` for a local-only daemon.
- **TLS** — set both `pristine.http.kernel-server.tls.key-path` and `…tls.cert-path` (PEM files) to
  switch from `http.Server` to `https.Server`.
- **Graceful shutdown** — `stop()` refuses new connections, drains in-flight requests, and
  force-closes sockets that outlive the drain window. Fired automatically on `SIGTERM`/`SIGINT`
  under `pristine start`.
- **Ephemeral ports** — after `start()`, `getAddress()` returns the bound `AddressInfo`; read
  `.port` when you bound to `:0`.

Requests are read into a Pristine `Request` (JSON bodies are parsed; `rawBody` keeps the unparsed
string for signature verification), dispatched via `kernel.handle()`, and the resulting `Response`
(or any returned object) is written back.

## CORS & preflight

A browser can't talk to a bare `KernelHttpServer`: an `OPTIONS` preflight matches no route and
`404`s before your code runs, and request interceptors run *after* route-matching — too late to
answer a preflight or reject an origin. This module solves that **from configuration**, handled
inside the server's request path *before* `kernel.handle()`, by a small, unit-testable
`CorsRequestHandler` collaborator.

**CORS is inactive unless configured** — with no `cors.*` keys set, the request path is identical
to before.

### Configuration keys

All keys live under `pristine.http.cors.*` (typed in `HttpConfigurationKeys`); each has an
environment-variable resolver. List keys accept a **comma-separated string** or a `string[]`.

| Key | Env var | Default | Purpose |
|---|---|---|---|
| `cors.allowed-origins` | `PRISTINE_HTTP_CORS_ALLOWED_ORIGINS` | `""` (disabled) | Exact-match origin allowlist. Empty = CORS off. |
| `cors.allowed-methods` | `PRISTINE_HTTP_CORS_ALLOWED_METHODS` | `GET,POST,PUT,DELETE,PATCH,OPTIONS` | Advertised in the preflight `Access-Control-Allow-Methods`. |
| `cors.allowed-headers` | `PRISTINE_HTTP_CORS_ALLOWED_HEADERS` | `Content-Type` | Advertised in the preflight `Access-Control-Allow-Headers`. |
| `cors.exposed-headers` | `PRISTINE_HTTP_CORS_EXPOSED_HEADERS` | `""` | `Access-Control-Expose-Headers` on actual responses. |
| `cors.max-age` | `PRISTINE_HTTP_CORS_MAX_AGE` | `600` | `Access-Control-Max-Age` (preflight cache seconds). |
| `cors.allow-credentials` | `PRISTINE_HTTP_CORS_ALLOW_CREDENTIALS` | `false` | Emit `Access-Control-Allow-Credentials: true` for allow-listed origins. |
| `cors.allow-private-network` | `PRISTINE_HTTP_CORS_ALLOW_PRIVATE_NETWORK` | `false` | Chrome Private Network Access — answer a preflight's `Access-Control-Request-Private-Network`. |
| `cors.allowed-hosts` | `PRISTINE_HTTP_CORS_ALLOWED_HOSTS` | `""` | Optional `Host`-header allowlist → `403` before routing (loopback DNS-rebinding defense). |

### Behavior

- **Preflight** — an `OPTIONS` carrying `Access-Control-Request-Method` from an allow-listed
  `Origin` is answered with a `204` **short-circuited before routing**, echoing
  `Access-Control-Allow-Origin`, `Vary: Origin`, the allowed methods/headers, and `max-age`
  (plus `Access-Control-Allow-Private-Network: true` when the preflight asks and PNA is enabled).
- **Simple / actual requests** — a request from an allow-listed `Origin` gets
  `Access-Control-Allow-Origin` + `Vary: Origin` echoed on its response, **including error (4xx/5xx)
  responses** — otherwise the browser can't read the error body.
- **Non-allow-listed origin** — **no** `Access-Control-Allow-Origin` is emitted. The server never
  sends `*` when an allowlist is configured and never reflects an arbitrary `Origin`.
- **Host allowlist** — when `cors.allowed-hosts` is set, a request whose `Host` isn't listed gets a
  `403` before routing. Independent of the origin allowlist.

### Example: a loopback daemon called from an HTTPS site

A daemon on `http://127.0.0.1:6635` that a deployed site at `https://app.example.com` calls from the
browser needs an origin allowlist, real preflight handling, Chrome Private Network Access, and a
Host allowlist. Set it entirely from the environment:

```bash
export PRISTINE_HTTP_KERNEL_SERVER_ADDRESS=127.0.0.1
export PRISTINE_HTTP_KERNEL_SERVER_PORT=6635
export PRISTINE_HTTP_CORS_ALLOWED_ORIGINS=https://app.example.com
export PRISTINE_HTTP_CORS_ALLOW_CREDENTIALS=true
export PRISTINE_HTTP_CORS_ALLOW_PRIVATE_NETWORK=true
export PRISTINE_HTTP_CORS_ALLOWED_HOSTS=127.0.0.1:6635,localhost:6635
pristine start
```

...or from a config object (e.g. `pristine.config.ts`, or passed to `kernel.start()`):

```typescript
{
  "pristine.http.kernel-server.address": "127.0.0.1",
  "pristine.http.kernel-server.port": 6635,
  "pristine.http.cors.allowed-origins": "https://app.example.com",
  "pristine.http.cors.allow-credentials": true,
  "pristine.http.cors.allow-private-network": true,
  "pristine.http.cors.allowed-hosts": ["127.0.0.1:6635", "localhost:6635"],
}
```

## Serving static files

`HttpModule` ships a `file-server:start` command backed by `FileHttpServer`, handy for local
previews:

```bash
pristine file-server:start --directory ./public --port 9000 --address 127.0.0.1
```

Its defaults come from `pristine.http.http-server.file.address` (`127.0.0.1`) and
`pristine.http.http-server.file.port` (`9000`).

## Configuration keys

Import `HttpConfigurationKeys` for typed keys instead of magic strings (pairs with `@injectConfig`).

| Key | Default | Purpose |
|---|---|---|
| `pristine.http.logging-enabled` | `true` | Toggle the client's request/response logging interceptors. |
| `pristine.http.kernel-server.address` | `0.0.0.0` | `KernelHttpServer` bind address. |
| `pristine.http.kernel-server.port` | `3000` | `KernelHttpServer` bind port. |
| `pristine.http.kernel-server.tls.key-path` | `""` | TLS private key (PEM); set with `cert-path` to enable HTTPS. |
| `pristine.http.kernel-server.tls.cert-path` | `""` | TLS certificate (PEM). |
| `pristine.http.http-server.file.address` | `127.0.0.1` | `file-server:start` bind address. |
| `pristine.http.http-server.file.port` | `9000` | `file-server:start` bind port. |
| `pristine.http.cors.*` | — | See [CORS & preflight](#cors--preflight). |
