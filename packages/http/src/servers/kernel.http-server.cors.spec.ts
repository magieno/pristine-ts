import "reflect-metadata";
import {injectable} from "tsyringe";
import {Kernel} from "@pristine-ts/core";
import {AppModuleInterface, HttpMethod} from "@pristine-ts/common";
import {controller, route} from "@pristine-ts/networking";
import {HttpModule} from "../http.module";
import {HttpConfigurationKeys} from "../http.configuration-keys";
import {CorsRequestHandler} from "../cors/cors-request.handler";
import {KernelHttpServer} from "./kernel.http-server";

/**
 * End-to-end CORS coverage against a REAL `KernelHttpServer` bound to `127.0.0.1:0` (ephemeral
 * port), driven with real `fetch` over an actual socket. Proves the wiring the pure
 * `CorsRequestHandler` unit tests can't: that `KernelHttpServer.handleRequest` short-circuits a
 * preflight before routing and echoes `Access-Control-Allow-Origin` on real responses.
 *
 * `@pristine-ts/networking` is already in `HttpModule`'s graph (`ValidationModule` imports
 * `NetworkingModule`), so its `Router` routes to the controller below — declared with the real
 * `@controller`/`@route` decorators and discovered from networking's global controller registry.
 */

const ALLOWED_ORIGIN = "https://app.example.com";

@controller("/widgets")
@injectable()
class WidgetsTestController {
  @route(HttpMethod.Get, "")
  async list(): Promise<object> {
    return {ok: true, path: "/widgets"};
  }

  @route(HttpMethod.Get, "/boom")
  async boom(): Promise<object> {
    throw new Error("intentional failure to exercise the error path");
  }
}

// Reference the class so its `@controller`/`@route` side effects run even under aggressive tree-shaking.
void WidgetsTestController;

interface LiveServer {
  server: KernelHttpServer;
  baseUrl: string;
}

const appModule = (): AppModuleInterface => ({
  keyname: "test.http-cors-app",
  importModules: [HttpModule],
  importServices: [],
});

/**
 * Boots a kernel with `HttpModule` + the given CORS config, then starts a `KernelHttpServer` on an
 * ephemeral loopback port. Mirrors what the CLI's `bootstrap()` does — notably
 * `registerInstance(Kernel, kernel)` so `KernelHttpServer`'s injected `kernel` is the running one.
 */
async function bootServer(corsConfig: { [key: string]: unknown }): Promise<LiveServer> {
  const kernel = new Kernel();
  await kernel.start(appModule(), {
    "pristine.logging.consoleLoggerActivated": false,
    ...corsConfig,
  });
  kernel.container.registerInstance(Kernel, kernel);

  const server = kernel.container.resolve(KernelHttpServer);
  await server.start({port: 0, address: "127.0.0.1"});

  const address = server.getAddress();
  if (address === null || typeof address === "string") {
    throw new Error("KernelHttpServer did not bind to a TCP address");
  }

  return {server, baseUrl: `http://127.0.0.1:${address.port}`};
}

describe("KernelHttpServer CORS (live socket)", () => {
  describe("with an origin allowlist (+ Private Network Access enabled)", () => {
    let live: LiveServer;

    beforeAll(async () => {
      live = await bootServer({
        [HttpConfigurationKeys.CorsAllowedOrigins]: ALLOWED_ORIGIN,
        [HttpConfigurationKeys.CorsAllowedHeaders]: "Content-Type,Authorization",
        [HttpConfigurationKeys.CorsAllowPrivateNetwork]: true,
      });
    });

    afterAll(async () => {
      await live?.server.stop();
    });

    it("answers a preflight with 204 + echoed ACAO, allowed methods, max-age, and the PNA grant", async () => {
      const response = await fetch(`${live.baseUrl}/widgets`, {
        method: "OPTIONS",
        headers: {
          "Origin": ALLOWED_ORIGIN,
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Private-Network": "true",
        },
      });
      // Drain the (empty) body so the socket can be reused / closed cleanly.
      await response.text();

      expect(response.status).toBe(204);
      expect(response.headers.get("access-control-allow-origin")).toBe(ALLOWED_ORIGIN);
      expect(response.headers.get("vary")).toContain("Origin");
      expect(response.headers.get("access-control-allow-methods")).toContain("GET");
      expect(response.headers.get("access-control-allow-headers")).toContain("Authorization");
      expect(response.headers.get("access-control-max-age")).toBe("600");
      expect(response.headers.get("access-control-allow-private-network")).toBe("true");
    });

    it("echoes ACAO + Vary on an actual (routed 200) GET", async () => {
      const response = await fetch(`${live.baseUrl}/widgets`, {
        method: "GET",
        headers: {"Origin": ALLOWED_ORIGIN},
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBe(ALLOWED_ORIGIN);
      expect(response.headers.get("vary")).toContain("Origin");
      expect(body).toEqual({ok: true, path: "/widgets"});
    });

    it("still echoes ACAO on an error (500) response so the browser can read the body", async () => {
      const response = await fetch(`${live.baseUrl}/widgets/boom`, {
        method: "GET",
        headers: {"Origin": ALLOWED_ORIGIN},
      });
      await response.text();

      expect(response.status).toBeGreaterThanOrEqual(500);
      expect(response.headers.get("access-control-allow-origin")).toBe(ALLOWED_ORIGIN);
    });

    it("emits no ACAO for a non-allow-listed origin", async () => {
      const response = await fetch(`${live.baseUrl}/widgets`, {
        method: "GET",
        headers: {"Origin": "https://evil.example.com"},
      });
      await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBeNull();
    });
  });

  describe("with a Host allowlist", () => {
    let live: LiveServer;

    beforeAll(async () => {
      // The allowlist deliberately excludes the ephemeral `127.0.0.1:<port>` Host that fetch will
      // send, so every request should be rejected before routing.
      live = await bootServer({
        [HttpConfigurationKeys.CorsAllowedHosts]: "daemon.local:6635",
      });
    });

    afterAll(async () => {
      await live?.server.stop();
    });

    it("rejects a request whose Host is not allow-listed with a 403 before routing", async () => {
      const response = await fetch(`${live.baseUrl}/widgets`, {method: "GET"});
      await response.text();

      expect(response.status).toBe(403);
    });
  });
});

/**
 * Deterministic unit coverage for the one behavior a live-socket test can't force reliably: the
 * CORS headers being applied on `handleRequest`'s catch/500 path (kernel.handle rejecting), not
 * only the success path. Drives the private method with a stub kernel that throws and a fake
 * `ServerResponse` that records what got written.
 */
describe("KernelHttpServer CORS error path", () => {
  const buildFakeResponse = () => {
    const headers: { [name: string]: string } = {};
    return {
      headersSent: false,
      statusCode: 0,
      setHeader(name: string, value: string) {
        headers[name.toLowerCase()] = value;
      },
      end(_body?: unknown) {
        (this as any).ended = true;
      },
      ended: false,
      capturedHeaders: headers,
    };
  };

  it("echoes Access-Control-Allow-Origin on the 500 when kernel.handle throws", async () => {
    const corsRequestHandler = new CorsRequestHandler(ALLOWED_ORIGIN, "GET,POST", "Content-Type", "", 600, false, false, "");
    const logHandler = {error: jest.fn(), warning: jest.fn(), info: jest.fn(), debug: jest.fn()} as any;
    const kernel = {handle: jest.fn().mockRejectedValue(new Error("boom"))} as any;
    const eventIdManager = {generateEventId: () => "req-1"} as any;

    const server = new KernelHttpServer("127.0.0.1", 0, "", "", 104857600, logHandler, kernel, eventIdManager, corsRequestHandler);

    const req = {
      method: "GET",
      url: "/widgets",
      headers: {origin: ALLOWED_ORIGIN, host: "127.0.0.1:6635"},
      socket: {},
    } as any;
    const res = buildFakeResponse();

    await (server as any).handleRequest(req, res as any);

    expect(kernel.handle).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(500);
    expect(res.capturedHeaders["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
    expect(res.capturedHeaders["vary"]).toBe("Origin");
    expect(res.ended).toBe(true);
  });

  it("omits Access-Control-Allow-Origin on the 500 for a non-allow-listed origin", async () => {
    const corsRequestHandler = new CorsRequestHandler(ALLOWED_ORIGIN, "GET,POST", "Content-Type", "", 600, false, false, "");
    const logHandler = {error: jest.fn(), warning: jest.fn(), info: jest.fn(), debug: jest.fn()} as any;
    const kernel = {handle: jest.fn().mockRejectedValue(new Error("boom"))} as any;
    const eventIdManager = {generateEventId: () => "req-2"} as any;

    const server = new KernelHttpServer("127.0.0.1", 0, "", "", 104857600, logHandler, kernel, eventIdManager, corsRequestHandler);

    const req = {
      method: "GET",
      url: "/widgets",
      headers: {origin: "https://evil.example.com", host: "127.0.0.1:6635"},
      socket: {},
    } as any;
    const res = buildFakeResponse();

    await (server as any).handleRequest(req, res as any);

    expect(res.statusCode).toBe(500);
    expect(res.capturedHeaders["access-control-allow-origin"]).toBeUndefined();
  });
});
