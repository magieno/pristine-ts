import "reflect-metadata";
import {injectable} from "tsyringe";
import {isIP} from "net";
import {Kernel} from "@pristine-ts/core";
import {AppModuleInterface, HttpMethod, Request, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {controller, request, RequestInterceptorInterface, route} from "@pristine-ts/networking";
import {HttpModule} from "../http.module";
import {KernelHttpServer} from "./kernel.http-server";

/**
 * `Request.remoteAddress` against a REAL `KernelHttpServer` bound to `127.0.0.1:0`, driven with
 * real `fetch` over an actual socket. The point is trust: the address a controller or an
 * interceptor sees is the TCP peer, and no request header can change it. Nothing here is mocked.
 */

/** The forms Node reports for a loopback peer: IPv4, IPv6, and IPv4 mapped on a dual-stack socket. */
const LOOPBACK_ADDRESSES = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];

/** `fetch`'s `json()` is typed `unknown`; the assertions below index into the result freely. */
const readJson = (response: globalThis.Response): Promise<any> => response.json() as Promise<any>;

/** What the last request looked like to the interceptor and to the controller. */
const captured: { interceptorRemoteAddress?: string; controllerRequest?: Request; interceptorCalls: number } = {interceptorCalls: 0};

@tag(ServiceDefinitionTagEnum.RequestInterceptor)
@injectable()
class RemoteAddressCaptureInterceptor implements RequestInterceptorInterface {
  async interceptRequest(req: Request): Promise<Request> {
    captured.interceptorCalls += 1;
    captured.interceptorRemoteAddress = req.remoteAddress;
    return req;
  }
}

@controller("/remote-address")
@injectable()
class RemoteAddressTestController {
  @route(HttpMethod.Get, "/whoami")
  async whoami(@request() req: Request): Promise<object> {
    captured.controllerRequest = req;
    return {remoteAddress: req.remoteAddress};
  }

  @route(HttpMethod.Post, "/whoami")
  async whoamiPost(@request() req: Request): Promise<object> {
    captured.controllerRequest = req;
    return {remoteAddress: req.remoteAddress};
  }
}

// Reference the class so its `@controller`/`@route` side effects run even under aggressive tree-shaking.
void RemoteAddressTestController;

interface LiveServer {
  server: KernelHttpServer;
  baseUrl: string;
}

const appModule = (): AppModuleInterface => ({
  keyname: "test.http-remote-address-app",
  importModules: [HttpModule],
  importServices: [RemoteAddressCaptureInterceptor],
});

async function bootServer(): Promise<LiveServer> {
  const kernel = new Kernel();
  await kernel.start(appModule(), {
    "pristine.logging.consoleLoggerActivated": false,
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

describe("KernelHttpServer Request.remoteAddress (live socket)", () => {
  let live: LiveServer;

  beforeAll(async () => {
    live = await bootServer();
  });

  afterAll(async () => {
    await live?.server.stop();
  });

  beforeEach(() => {
    captured.interceptorCalls = 0;
    captured.interceptorRemoteAddress = undefined;
    captured.controllerRequest = undefined;
  });

  it("gives the controller the loopback address of the TCP peer", async () => {
    const response = await fetch(`${live.baseUrl}/remote-address/whoami`);
    const result = await readJson(response);

    expect(response.status).toBe(200);
    expect(isIP(result.remoteAddress)).not.toBe(0);
    expect(LOOPBACK_ADDRESSES).toContain(result.remoteAddress);
    expect(captured.controllerRequest?.remoteAddress).toBe(result.remoteAddress);
  });

  it("gives a request interceptor the same address, before the controller runs", async () => {
    const response = await fetch(`${live.baseUrl}/remote-address/whoami`);
    const result = await readJson(response);

    expect(response.status).toBe(200);
    expect(captured.interceptorCalls).toBe(1);
    expect(LOOPBACK_ADDRESSES).toContain(captured.interceptorRemoteAddress);
    expect(captured.interceptorRemoteAddress).toBe(result.remoteAddress);
  });

  it("sets it on a request that has a body too", async () => {
    const response = await fetch(`${live.baseUrl}/remote-address/whoami`, {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify({hello: "world"}),
    });
    const result = await readJson(response);

    expect(response.status).toBe(200);
    expect(LOOPBACK_ADDRESSES).toContain(result.remoteAddress);
  });

  it("ignores forged forwarding headers: the address stays the TCP peer", async () => {
    const baseline = await readJson(await fetch(`${live.baseUrl}/remote-address/whoami`));

    const response = await fetch(`${live.baseUrl}/remote-address/whoami`, {
      headers: {
        "x-forwarded-for": "203.0.113.7, 198.51.100.2",
        "forwarded": "for=203.0.113.7;proto=https",
        "x-real-ip": "203.0.113.7",
        "x-client-ip": "203.0.113.7",
        "true-client-ip": "203.0.113.7",
        "cf-connecting-ip": "203.0.113.7",
      },
    });
    const result = await readJson(response);

    expect(response.status).toBe(200);
    // The forged headers did reach the handler: they are data, not identity.
    expect(captured.controllerRequest?.getHeader("x-forwarded-for")).toBe("203.0.113.7, 198.51.100.2");
    expect(result.remoteAddress).toBe(baseline.remoteAddress);
    expect(LOOPBACK_ADDRESSES).toContain(result.remoteAddress);
    expect(captured.interceptorRemoteAddress).toBe(baseline.remoteAddress);
  });

  it("cannot be turned into a loopback address by a header when the caller is not loopback", async () => {
    // Drive the private mapper with a non-loopback peer: a live socket from another host is not
    // available in a unit test. The forged headers claim loopback; the socket says otherwise.
    const fakeIncomingMessage: any = {
      url: "/remote-address/whoami",
      method: "GET",
      headers: {
        "host": "example.test",
        "x-forwarded-for": "127.0.0.1",
        "forwarded": "for=127.0.0.1",
        "x-real-ip": "127.0.0.1",
      },
      socket: {remoteAddress: "203.0.113.7"},
    };

    const mapped: Request = await (live.server as any).mapToPristineRequest(fakeIncomingMessage, "request-id");

    expect(mapped.remoteAddress).toBe("203.0.113.7");
  });

  it("is undefined when the socket has no remote address (already destroyed)", async () => {
    const fakeIncomingMessage: any = {
      url: "/remote-address/whoami",
      method: "GET",
      headers: {"x-forwarded-for": "127.0.0.1"},
      socket: {remoteAddress: undefined},
    };

    const mapped: Request = await (live.server as any).mapToPristineRequest(fakeIncomingMessage, "request-id");

    expect(mapped.remoteAddress).toBeUndefined();
  });
});
