import {injectable} from "tsyringe";
import {injectConfig, moduleScoped} from "@pristine-ts/common";
import {HttpModuleKeyname} from "../http.module.keyname";
import {HttpConfigurationKeys} from "../http.configuration-keys";
import {CorsRequestContextInterface} from "./cors-request-context.interface";
import {CorsPreflightResponseInterface} from "./cors-preflight-response.interface";

/**
 * The config-driven CORS policy engine that `KernelHttpServer` consults inside its request path,
 * BEFORE `kernel.handle()` — the one place that sees the raw request/response and can answer a
 * preflight or reject an origin without the networking `Router` ever running.
 *
 * All decision methods are pure functions of the injected configuration plus a normalized
 * {@link CorsRequestContextInterface}, so the full behavior matrix is unit-testable by
 * constructing this class directly (no live socket, no Node request object required).
 *
 * ## Activation
 * CORS is **inactive unless configured**. Two independent switches:
 *   - `cors.allowed-origins` non-empty  → origin/preflight/header-echo logic activates.
 *   - `cors.allowed-hosts`   non-empty  → the Host-header allowlist (DNS-rebinding defense) activates.
 * With neither set, every method is a no-op and the server behaves exactly as it did before CORS
 * existed.
 *
 * ## Guarantees
 *   - Never emits `Access-Control-Allow-Origin: *` — only an exact echo of an allow-listed Origin.
 *   - Never reflects an arbitrary Origin — an Origin absent from the allowlist gets no ACAO headers.
 */
@moduleScoped(HttpModuleKeyname)
@injectable()
export class CorsRequestHandler {
  private readonly allowedOrigins: string[];
  private readonly allowedMethods: string[];
  private readonly allowedHeaders: string[];
  private readonly exposedHeaders: string[];
  private readonly maxAge: number;
  private readonly allowCredentials: boolean;
  private readonly allowPrivateNetwork: boolean;
  private readonly allowedHosts: string[];

  constructor(
    @injectConfig(HttpConfigurationKeys.CorsAllowedOrigins) allowedOrigins: string | string[],
    @injectConfig(HttpConfigurationKeys.CorsAllowedMethods) allowedMethods: string | string[],
    @injectConfig(HttpConfigurationKeys.CorsAllowedHeaders) allowedHeaders: string | string[],
    @injectConfig(HttpConfigurationKeys.CorsExposedHeaders) exposedHeaders: string | string[],
    @injectConfig(HttpConfigurationKeys.CorsMaxAge) maxAge: number,
    @injectConfig(HttpConfigurationKeys.CorsAllowCredentials) allowCredentials: boolean,
    @injectConfig(HttpConfigurationKeys.CorsAllowPrivateNetwork) allowPrivateNetwork: boolean,
    @injectConfig(HttpConfigurationKeys.CorsAllowedHosts) allowedHosts: string | string[],
  ) {
    this.allowedOrigins = this.normalizeList(allowedOrigins);
    this.allowedMethods = this.normalizeList(allowedMethods);
    this.allowedHeaders = this.normalizeList(allowedHeaders);
    this.exposedHeaders = this.normalizeList(exposedHeaders);
    this.maxAge = maxAge;
    this.allowCredentials = allowCredentials === true;
    this.allowPrivateNetwork = allowPrivateNetwork === true;
    this.allowedHosts = this.normalizeList(allowedHosts);
  }

  /**
   * `true` when an origin allowlist is configured — gates the preflight short-circuit and the
   * `Access-Control-Allow-Origin` echo on actual responses.
   */
  public get isOriginCheckEnabled(): boolean {
    return this.allowedOrigins.length > 0;
  }

  /**
   * `true` when a Host allowlist is configured — gates the DNS-rebinding 403.
   */
  public get isHostCheckEnabled(): boolean {
    return this.allowedHosts.length > 0;
  }

  /**
   * Whether any CORS feature is active. `KernelHttpServer` can skip all CORS work when this is
   * `false`, keeping the un-configured request path byte-for-byte identical to before.
   */
  public get isEnabled(): boolean {
    return this.isOriginCheckEnabled || this.isHostCheckEnabled;
  }

  /**
   * Normalizes a raw Node request into the transport-agnostic {@link CorsRequestContextInterface}.
   * Node lower-cases header names on `IncomingMessage`, and multi-valued headers arrive as arrays;
   * we take the method + the CORS-relevant headers and coerce them to the single-string shape the
   * decision methods expect.
   */
  public buildContext(method: string, headers: { [key: string]: string | string[] | undefined }): CorsRequestContextInterface {
    const readHeader = (name: string): string | undefined => {
      const value = headers[name];
      if (Array.isArray(value)) {
        return value[0];
      }
      return value ?? undefined;
    };

    return {
      method: (method ?? "GET").toUpperCase(),
      origin: readHeader("origin"),
      host: readHeader("host"),
      accessControlRequestMethod: readHeader("access-control-request-method"),
      accessControlRequestHeaders: readHeader("access-control-request-headers"),
      accessControlRequestPrivateNetwork: (readHeader("access-control-request-private-network") ?? "").toLowerCase() === "true",
    };
  }

  /**
   * Host-header allowlist check (loopback DNS-rebinding defense). Returns `true` (allow) when no
   * allowlist is configured; otherwise the request's `Host` must exactly match a configured entry
   * (case-insensitive, since host names are). A missing `Host` against a configured allowlist is
   * rejected. `KernelHttpServer` turns a `false` here into a `403` before any routing.
   */
  public isHostAllowed(host: string | undefined): boolean {
    if (this.isHostCheckEnabled === false) {
      return true;
    }
    if (host === undefined) {
      return false;
    }
    const normalizedHost = host.trim().toLowerCase();
    return this.allowedHosts.some(allowedHost => allowedHost.toLowerCase() === normalizedHost);
  }

  /**
   * Exact-match origin allowlist check. An absent Origin is never "allowed" (there is nothing to
   * echo). We never wildcard and never reflect an arbitrary Origin.
   */
  public isOriginAllowed(origin: string | undefined): boolean {
    if (origin === undefined) {
      return false;
    }
    const normalizedOrigin = origin.trim();
    return this.allowedOrigins.some(allowedOrigin => allowedOrigin === normalizedOrigin);
  }

  /**
   * Decides whether `context` is a CORS preflight that must be answered before routing, and if so
   * returns the `204` response (status + headers) to write. Returns `undefined` when the request is
   * not a preflight we own — the caller then lets it route normally.
   *
   * A CORS preflight is an `OPTIONS` carrying `Access-Control-Request-Method`. We only take over
   * preflight handling when an origin allowlist is configured (same-origin requests never send
   * `Access-Control-Request-Method`, so app-owned `OPTIONS` routes are never stolen). An allow-listed
   * Origin gets the full `Access-Control-*` set; a disallowed Origin still gets a bare `204` with no
   * ACAO — the browser blocks it, and we never leak an arbitrary Origin.
   */
  public buildPreflightResponse(context: CorsRequestContextInterface): CorsPreflightResponseInterface | undefined {
    if (this.isOriginCheckEnabled === false) {
      return undefined;
    }
    if (context.method !== "OPTIONS" || context.accessControlRequestMethod === undefined) {
      return undefined;
    }

    const headers: { [name: string]: string } = {};

    if (this.isOriginAllowed(context.origin)) {
      headers["Access-Control-Allow-Origin"] = context.origin as string;
      headers["Vary"] = "Origin";
      headers["Access-Control-Allow-Methods"] = this.allowedMethods.join(", ");
      headers["Access-Control-Allow-Headers"] = this.allowedHeaders.join(", ");
      headers["Access-Control-Max-Age"] = String(this.maxAge);

      if (this.allowCredentials) {
        headers["Access-Control-Allow-Credentials"] = "true";
      }

      // Chrome Private Network Access: only answer the grant when the preflight actually asked for
      // it AND the operator opted in. Silence otherwise so we never advertise a capability we
      // weren't configured to allow.
      if (this.allowPrivateNetwork && context.accessControlRequestPrivateNetwork) {
        headers["Access-Control-Allow-Private-Network"] = "true";
      }
    }

    return {statusCode: 204, headers};
  }

  /**
   * The CORS headers to add to an ACTUAL (non-preflight) response — success OR error. Returns an
   * empty object when origin-checking is off or the Origin is not allow-listed. Applied to 4xx/5xx
   * responses too: without `Access-Control-Allow-Origin` the browser cannot read an error body.
   */
  public buildResponseHeaders(origin: string | undefined): { [name: string]: string } {
    if (this.isOriginCheckEnabled === false || this.isOriginAllowed(origin) === false) {
      return {};
    }

    const headers: { [name: string]: string } = {
      "Access-Control-Allow-Origin": origin as string,
      "Vary": "Origin",
    };

    if (this.allowCredentials) {
      headers["Access-Control-Allow-Credentials"] = "true";
    }

    if (this.exposedHeaders.length > 0) {
      headers["Access-Control-Expose-Headers"] = this.exposedHeaders.join(", ");
    }

    return headers;
  }

  /**
   * Coerces a list-shaped config value into a trimmed, empty-stripped `string[]`. Accepts both the
   * comma-separated string form (env vars / defaults) and the `string[]` form (programmatic
   * `kernel.start()` config).
   */
  private normalizeList(value: string | string[] | undefined | null): string[] {
    if (value === undefined || value === null) {
      return [];
    }
    const parts = Array.isArray(value) ? value : String(value).split(",");
    return parts.map(part => part.trim()).filter(part => part.length > 0);
  }
}
