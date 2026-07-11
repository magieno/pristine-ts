import "reflect-metadata";
import {CorsRequestHandler} from "./cors-request.handler";
import {CorsRequestContextInterface} from "./cors-request-context.interface";

/**
 * Unit coverage for the pure CORS decision engine. `CorsRequestHandler` is constructed directly
 * with raw config values (exactly the shape `@injectConfig` would inject), so the whole matrix —
 * allowed vs disallowed origin, preflight vs simple, PNA on/off, host hit/miss, credentials on/off,
 * header echo — is exercised without a live socket.
 */
describe("CorsRequestHandler", () => {
  const ALLOWED_ORIGIN = "https://app.example.com";
  const OTHER_ORIGIN = "https://evil.example.com";

  /**
   * Builds a handler with the module's documented defaults, overridable per-test. The positional
   * argument order mirrors the constructor's `@injectConfig` parameters.
   */
  const makeHandler = (overrides: Partial<{
    allowedOrigins: string | string[];
    allowedMethods: string | string[];
    allowedHeaders: string | string[];
    exposedHeaders: string | string[];
    maxAge: number;
    allowCredentials: boolean;
    allowPrivateNetwork: boolean;
    allowedHosts: string | string[];
  }> = {}): CorsRequestHandler => {
    const config = {
      allowedOrigins: "",
      allowedMethods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
      allowedHeaders: "Content-Type",
      exposedHeaders: "",
      maxAge: 600,
      allowCredentials: false,
      allowPrivateNetwork: false,
      allowedHosts: "",
      ...overrides,
    };
    return new CorsRequestHandler(
      config.allowedOrigins,
      config.allowedMethods,
      config.allowedHeaders,
      config.exposedHeaders,
      config.maxAge,
      config.allowCredentials,
      config.allowPrivateNetwork,
      config.allowedHosts,
    );
  };

  const preflightContext = (overrides: Partial<CorsRequestContextInterface> = {}): CorsRequestContextInterface => ({
    method: "OPTIONS",
    origin: ALLOWED_ORIGIN,
    accessControlRequestMethod: "GET",
    accessControlRequestPrivateNetwork: false,
    ...overrides,
  });

  describe("activation (inactive unless configured)", () => {
    it("is fully disabled when nothing is configured", () => {
      const handler = makeHandler();

      expect(handler.isEnabled).toBe(false);
      expect(handler.isOriginCheckEnabled).toBe(false);
      expect(handler.isHostCheckEnabled).toBe(false);
      expect(handler.buildPreflightResponse(preflightContext())).toBeUndefined();
      expect(handler.buildResponseHeaders(ALLOWED_ORIGIN)).toEqual({});
      // No host allowlist → every host is allowed (no 403).
      expect(handler.isHostAllowed("anything:1234")).toBe(true);
    });

    it("activates origin checking independently of host checking", () => {
      expect(makeHandler({allowedOrigins: ALLOWED_ORIGIN}).isOriginCheckEnabled).toBe(true);
      expect(makeHandler({allowedOrigins: ALLOWED_ORIGIN}).isHostCheckEnabled).toBe(false);
      expect(makeHandler({allowedHosts: "127.0.0.1:6635"}).isHostCheckEnabled).toBe(true);
      expect(makeHandler({allowedHosts: "127.0.0.1:6635"}).isOriginCheckEnabled).toBe(false);
    });
  });

  describe("simple (non-preflight) response headers", () => {
    it("echoes ACAO + Vary for an allow-listed origin", () => {
      const handler = makeHandler({allowedOrigins: ALLOWED_ORIGIN});

      expect(handler.buildResponseHeaders(ALLOWED_ORIGIN)).toEqual({
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Vary": "Origin",
      });
    });

    it("emits nothing for a non-allow-listed origin (never reflects an arbitrary Origin)", () => {
      const handler = makeHandler({allowedOrigins: ALLOWED_ORIGIN});

      expect(handler.buildResponseHeaders(OTHER_ORIGIN)).toEqual({});
    });

    it("emits nothing when the request carries no Origin", () => {
      const handler = makeHandler({allowedOrigins: ALLOWED_ORIGIN});

      expect(handler.buildResponseHeaders(undefined)).toEqual({});
    });

    it("never emits a wildcard even with multiple origins configured", () => {
      const handler = makeHandler({allowedOrigins: [ALLOWED_ORIGIN, "https://second.example.com"]});

      const headers = handler.buildResponseHeaders(ALLOWED_ORIGIN);
      expect(headers["Access-Control-Allow-Origin"]).toBe(ALLOWED_ORIGIN);
      expect(Object.values(headers)).not.toContain("*");
    });

    it("adds Access-Control-Expose-Headers only when exposed-headers is configured", () => {
      const withExposed = makeHandler({allowedOrigins: ALLOWED_ORIGIN, exposedHeaders: "X-Total-Count, X-Page"});
      expect(withExposed.buildResponseHeaders(ALLOWED_ORIGIN)["Access-Control-Expose-Headers"]).toBe("X-Total-Count, X-Page");

      const withoutExposed = makeHandler({allowedOrigins: ALLOWED_ORIGIN});
      expect(withoutExposed.buildResponseHeaders(ALLOWED_ORIGIN)["Access-Control-Expose-Headers"]).toBeUndefined();
    });

    it("adds Access-Control-Allow-Credentials only when enabled", () => {
      const withCreds = makeHandler({allowedOrigins: ALLOWED_ORIGIN, allowCredentials: true});
      expect(withCreds.buildResponseHeaders(ALLOWED_ORIGIN)["Access-Control-Allow-Credentials"]).toBe("true");

      const withoutCreds = makeHandler({allowedOrigins: ALLOWED_ORIGIN});
      expect(withoutCreds.buildResponseHeaders(ALLOWED_ORIGIN)["Access-Control-Allow-Credentials"]).toBeUndefined();
    });
  });

  describe("preflight", () => {
    it("answers a 204 with the full Access-Control-* set for an allow-listed origin", () => {
      const handler = makeHandler({allowedOrigins: ALLOWED_ORIGIN});

      const result = handler.buildPreflightResponse(preflightContext());

      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(204);
      expect(result!.headers).toMatchObject({
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Vary": "Origin",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "600",
      });
    });

    it("short-circuits a disallowed-origin preflight with a bare 204 (no ACAO headers)", () => {
      const handler = makeHandler({allowedOrigins: ALLOWED_ORIGIN});

      const result = handler.buildPreflightResponse(preflightContext({origin: OTHER_ORIGIN}));

      expect(result).toBeDefined();
      expect(result!.statusCode).toBe(204);
      expect(result!.headers).toEqual({});
    });

    it("is not a preflight when there is no Access-Control-Request-Method (plain OPTIONS routes)", () => {
      const handler = makeHandler({allowedOrigins: ALLOWED_ORIGIN});

      const result = handler.buildPreflightResponse(preflightContext({accessControlRequestMethod: undefined}));

      expect(result).toBeUndefined();
    });

    it("is not a preflight for a non-OPTIONS method", () => {
      const handler = makeHandler({allowedOrigins: ALLOWED_ORIGIN});

      expect(handler.buildPreflightResponse(preflightContext({method: "GET"}))).toBeUndefined();
    });

    it("never takes over OPTIONS when origin checking is disabled", () => {
      const handler = makeHandler({allowedHosts: "127.0.0.1:6635"});

      expect(handler.buildPreflightResponse(preflightContext())).toBeUndefined();
    });

    it("includes Access-Control-Allow-Credentials on the preflight when enabled", () => {
      const handler = makeHandler({allowedOrigins: ALLOWED_ORIGIN, allowCredentials: true});

      expect(handler.buildPreflightResponse(preflightContext())!.headers["Access-Control-Allow-Credentials"]).toBe("true");
    });

    it("reflects configured allowed-methods / allowed-headers / max-age", () => {
      const handler = makeHandler({
        allowedOrigins: ALLOWED_ORIGIN,
        allowedMethods: "GET,POST",
        allowedHeaders: "Content-Type,Authorization",
        maxAge: 120,
      });

      const headers = handler.buildPreflightResponse(preflightContext())!.headers;
      expect(headers["Access-Control-Allow-Methods"]).toBe("GET, POST");
      expect(headers["Access-Control-Allow-Headers"]).toBe("Content-Type, Authorization");
      expect(headers["Access-Control-Max-Age"]).toBe("120");
    });
  });

  describe("Chrome Private Network Access", () => {
    it("grants Access-Control-Allow-Private-Network when requested AND enabled", () => {
      const handler = makeHandler({allowedOrigins: ALLOWED_ORIGIN, allowPrivateNetwork: true});

      const headers = handler.buildPreflightResponse(preflightContext({accessControlRequestPrivateNetwork: true}))!.headers;
      expect(headers["Access-Control-Allow-Private-Network"]).toBe("true");
    });

    it("withholds the grant when the preflight didn't ask for it", () => {
      const handler = makeHandler({allowedOrigins: ALLOWED_ORIGIN, allowPrivateNetwork: true});

      const headers = handler.buildPreflightResponse(preflightContext({accessControlRequestPrivateNetwork: false}))!.headers;
      expect(headers["Access-Control-Allow-Private-Network"]).toBeUndefined();
    });

    it("withholds the grant when the operator didn't opt in, even if requested", () => {
      const handler = makeHandler({allowedOrigins: ALLOWED_ORIGIN, allowPrivateNetwork: false});

      const headers = handler.buildPreflightResponse(preflightContext({accessControlRequestPrivateNetwork: true}))!.headers;
      expect(headers["Access-Control-Allow-Private-Network"]).toBeUndefined();
    });
  });

  describe("host allowlist (DNS-rebinding defense)", () => {
    it("allows a host that exactly matches an entry", () => {
      const handler = makeHandler({allowedHosts: "127.0.0.1:6635, localhost:6635"});

      expect(handler.isHostAllowed("127.0.0.1:6635")).toBe(true);
      expect(handler.isHostAllowed("localhost:6635")).toBe(true);
    });

    it("rejects a host that is not in the allowlist", () => {
      const handler = makeHandler({allowedHosts: "127.0.0.1:6635"});

      expect(handler.isHostAllowed("evil.example.com")).toBe(false);
      expect(handler.isHostAllowed("127.0.0.1:9999")).toBe(false);
    });

    it("rejects a missing Host when an allowlist is configured", () => {
      const handler = makeHandler({allowedHosts: "127.0.0.1:6635"});

      expect(handler.isHostAllowed(undefined)).toBe(false);
    });

    it("matches host names case-insensitively", () => {
      const handler = makeHandler({allowedHosts: "LocalHost:6635"});

      expect(handler.isHostAllowed("localhost:6635")).toBe(true);
    });
  });

  describe("config normalization", () => {
    it("treats a comma-separated string and a string[] identically", () => {
      const fromString = makeHandler({allowedOrigins: "https://a.example.com, https://b.example.com"});
      const fromArray = makeHandler({allowedOrigins: ["https://a.example.com", "https://b.example.com"]});

      expect(fromString.isOriginAllowed("https://b.example.com")).toBe(true);
      expect(fromArray.isOriginAllowed("https://b.example.com")).toBe(true);
    });

    it("trims whitespace and drops empty entries", () => {
      const handler = makeHandler({allowedOrigins: " https://a.example.com , , https://b.example.com "});

      expect(handler.isOriginAllowed("https://a.example.com")).toBe(true);
      expect(handler.isOriginAllowed("https://b.example.com")).toBe(true);
      // The empty middle entry must not become a matchable "" origin.
      expect(handler.isOriginAllowed("")).toBe(false);
    });
  });

  describe("buildContext", () => {
    it("normalizes raw Node headers (lower-cased, array-valued, PNA flag) into a context", () => {
      const handler = makeHandler({allowedOrigins: ALLOWED_ORIGIN});

      const context = handler.buildContext("options", {
        "origin": ALLOWED_ORIGIN,
        "host": "127.0.0.1:6635",
        "access-control-request-method": "GET",
        "access-control-request-headers": "content-type",
        "access-control-request-private-network": "true",
        "set-cookie": ["a=1", "b=2"], // array-valued header → first element is taken
      });

      expect(context).toEqual({
        method: "OPTIONS",
        origin: ALLOWED_ORIGIN,
        host: "127.0.0.1:6635",
        accessControlRequestMethod: "GET",
        accessControlRequestHeaders: "content-type",
        accessControlRequestPrivateNetwork: true,
      });
    });

    it("defaults a missing method to GET and leaves optional headers undefined", () => {
      const handler = makeHandler();

      const context = handler.buildContext(undefined as unknown as string, {});

      expect(context.method).toBe("GET");
      expect(context.origin).toBeUndefined();
      expect(context.accessControlRequestPrivateNetwork).toBe(false);
    });
  });
});
