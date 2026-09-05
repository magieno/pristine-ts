import "reflect-metadata";
import express from "express";
import {AddressInfo} from "net";
import {Server} from "http";
import {injectable} from "tsyringe";
import {ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {AppModuleInterface, HttpMethod, Request} from "@pristine-ts/common";
import {body, controller, request, route} from "@pristine-ts/networking";
import {ExpressModule} from "./express.module";
import {RawBodyCapture} from "./utils/raw-body.capture";
import {RequestMapper} from "./mappers/request.mapper";

/**
 * Binary round trip through a REAL Express app, wired to the kernel the way the README shows,
 * with `express.json()` mounted globally (the common setup) plus the documented
 * `RawBodyCapture` hook. Proves `Request.rawBody` is the bytes, never the parsed object.
 */

function buildBinaryPayload(size: number = 2048): Buffer {
  const payload = Buffer.alloc(size);
  for (let i = 0; i < size; i++) {
    payload[i] = i & 0xff;
  }
  payload[0] = 0xff;
  payload[1] = 0xf1;
  return payload;
}

const captured: { request?: Request; body?: unknown } = {};

@controller("/express-bodies")
@injectable()
class ExpressBodiesTestController {
  @route(HttpMethod.Post, "/json")
  async json(@request() req: Request, @body() parsed: unknown): Promise<object> {
    captured.request = req;
    captured.body = parsed;
    return {body: parsed, rawBodyIsBuffer: Buffer.isBuffer(req.rawBody)};
  }

  @route(HttpMethod.Put, "/binary/:id")
  async binary(@request() req: Request, @body() parsed: unknown): Promise<object> {
    captured.request = req;
    captured.body = parsed;
    return {rawBodyIsBuffer: Buffer.isBuffer(req.rawBody), length: req.getRawBodyBuffer()?.length ?? -1};
  }
}

void ExpressBodiesTestController;

const appModule = (): AppModuleInterface => ({
  keyname: "test.express-bodies-app",
  importModules: [ExpressModule],
  importServices: [],
});

interface LiveApp {
  server: Server;
  baseUrl: string;
}

/**
 * Starts the kernel and an Express app on an ephemeral port. `express.json()` is mounted globally
 * with the `RawBodyCapture` hook; the catch-all `express.raw()` after it is what makes Express
 * read a body no JSON parser accepts (audio, images, octet-stream).
 */
async function bootApp(withCapture: boolean): Promise<LiveApp & { kernel: Kernel }> {
  const kernel = new Kernel();
  await kernel.start(appModule(), {"pristine.logging.consoleLoggerActivated": false});

  const app = express();
  if (withCapture) {
    app.use(express.json({verify: RawBodyCapture.verify}));
    app.use(express.raw({type: () => true, verify: RawBodyCapture.verify}));
  } else {
    app.use(express.json());
  }

  app.all("*", async (req, res) => {
    await kernel.handle(req, {keyname: ExecutionContextKeynameEnum.Express, context: {req, res}});
  });

  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const address = server.address() as AddressInfo;

  return {server, baseUrl: `http://127.0.0.1:${address.port}`, kernel};
}

const readJson = (response: globalThis.Response): Promise<any> => response.json() as Promise<any>;

describe("Express raw request bodies (live app)", () => {
  describe("with express.json() mounted globally and the RawBodyCapture hook", () => {
    let live: LiveApp;

    beforeAll(async () => {
      live = await bootApp(true);
    });

    afterAll(async () => {
      await new Promise<void>((resolve) => live.server.close(() => resolve()));
    });

    it("parses a JSON POST into `body` and keeps the exact request text as a Buffer on `rawBody`", async () => {
      const text = JSON.stringify({title: "Café ☕", count: 3});

      const response = await fetch(`${live.baseUrl}/express-bodies/json`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: text,
      });
      const result = await readJson(response);

      expect(response.status).toBe(200);
      expect(result.body).toEqual({title: "Café ☕", count: 3});
      expect(result.rawBodyIsBuffer).toBe(true);
      expect((captured.request!.rawBody as Buffer).equals(Buffer.from(text, "utf8"))).toBe(true);
    });

    it("delivers a binary audio/aac PUT with `rawBody` equal to the bytes that were sent", async () => {
      const payload = buildBinaryPayload();

      const response = await fetch(`${live.baseUrl}/express-bodies/binary/segment-1`, {
        method: "PUT",
        headers: {"content-type": "audio/aac"},
        body: payload,
      });
      const result = await readJson(response);

      expect(response.status).toBe(200);
      expect(result.rawBodyIsBuffer).toBe(true);
      expect(result.length).toBe(payload.length);
      expect((captured.request!.rawBody as Buffer).equals(payload)).toBe(true);
      expect(Buffer.isBuffer(captured.body)).toBe(true);
      expect((captured.body as Buffer).equals(payload)).toBe(true);
    });
  });

  describe("with a plain express.json() and no capture hook", () => {
    let live: LiveApp;

    beforeAll(async () => {
      live = await bootApp(false);
    });

    afterAll(async () => {
      await new Promise<void>((resolve) => live.server.close(() => resolve()));
    });

    it("never puts the parsed object on `rawBody`", async () => {
      const response = await fetch(`${live.baseUrl}/express-bodies/json`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({parsed: true}),
      });
      const result = await readJson(response);

      expect(response.status).toBe(200);
      expect(result.body).toEqual({parsed: true});
      expect(result.rawBodyIsBuffer).toBe(false);
      expect(captured.request!.rawBody).toBeUndefined();
    });
  });
});

describe("RequestMapper.rawBody", () => {
  const mapperFor = async (): Promise<RequestMapper> => {
    const kernel = new Kernel();
    await kernel.start(appModule(), {"pristine.logging.consoleLoggerActivated": false});
    return kernel.container.resolve(RequestMapper);
  };

  const fakeExpressRequest = (body: unknown, rawBody?: Buffer): any => ({
    method: "POST",
    url: "/mapped",
    headers: {"content-type": "application/json"},
    header: (): undefined => undefined,
    body,
    rawBody,
  });

  it("prefers the captured Buffer over the parsed body", async () => {
    const mapper = await mapperFor();
    const bytes = Buffer.from('{"a":1}');

    const mapped = mapper.map(fakeExpressRequest({a: 1}, bytes));

    expect(mapped.body).toEqual({a: 1});
    expect(mapped.rawBody).toBe(bytes);
  });

  it("uses a Buffer or string body as the raw body when nothing was captured", async () => {
    const mapper = await mapperFor();
    const bytes = Buffer.from([0xff, 0xf1, 0x00]);

    expect(mapper.map(fakeExpressRequest(bytes)).rawBody).toBe(bytes);
    expect(mapper.map(fakeExpressRequest("text body")).rawBody).toBe("text body");
  });

  it("leaves rawBody undefined for a parsed object with no capture", async () => {
    const mapper = await mapperFor();

    expect(mapper.map(fakeExpressRequest({a: 1})).rawBody).toBeUndefined();
  });
});
