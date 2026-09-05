import "reflect-metadata";
import {injectable} from "tsyringe";
import {Kernel} from "@pristine-ts/core";
import {AppModuleInterface, HttpMethod, Request, Response} from "@pristine-ts/common";
import {body, controller, request, route} from "@pristine-ts/networking";
import {HttpModule} from "../http.module";
import {HttpConfigurationKeys} from "../http.configuration-keys";
import {KernelHttpServer} from "./kernel.http-server";

/**
 * Request/response body coverage against a REAL `KernelHttpServer` bound to `127.0.0.1:0`,
 * driven with real `fetch` over an actual socket. The point is byte fidelity: a binary upload
 * must reach the handler as the exact bytes that were sent, and a Buffer response must leave
 * byte-for-byte. Nothing here is mocked.
 */

/**
 * Every byte value 0x00–0xFF, repeated, behind the ADTS sync word `0xFF 0xF1`. Not valid UTF-8,
 * so any `toString("utf8")` on the way in would replace bytes with U+FFFD and the equality
 * check below would fail.
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

/** `fetch`'s `json()` is typed `unknown`; the assertions below index into the result freely. */
const readJson = (response: globalThis.Response): Promise<any> => response.json() as Promise<any>;

/** What the last handler invocation saw, captured for assertions the response can't carry. */
const captured: { request?: Request; body?: unknown; limitHandlerCalls: number } = {limitHandlerCalls: 0};

@controller("/bodies")
@injectable()
class BodiesTestController {
  @route(HttpMethod.Post, "/json")
  async json(@request() req: Request, @body() parsed: unknown): Promise<object> {
    captured.request = req;
    captured.body = parsed;
    return {
      body: parsed,
      rawBodyIsBuffer: Buffer.isBuffer(req.rawBody),
      rawBodyUtf8: req.getRawBodyBuffer()?.toString("utf8"),
    };
  }

  @route(HttpMethod.Post, "/text")
  async text(@request() req: Request, @body() parsed: unknown): Promise<object> {
    captured.request = req;
    captured.body = parsed;
    return {bodyType: typeof parsed, body: parsed, rawBodyIsBuffer: Buffer.isBuffer(req.rawBody)};
  }

  @route(HttpMethod.Put, "/binary/:id")
  async binary(@request() req: Request, @body() parsed: unknown): Promise<object> {
    captured.request = req;
    captured.body = parsed;
    return {bodyIsBuffer: Buffer.isBuffer(parsed), length: Buffer.isBuffer(parsed) ? parsed.length : -1};
  }

  @route(HttpMethod.Post, "/limited")
  async limited(@body() parsed: unknown): Promise<object> {
    captured.limitHandlerCalls += 1;
    captured.body = parsed;
    return {ok: true};
  }

  @route(HttpMethod.Post, "/empty")
  async empty(@request() req: Request): Promise<object> {
    captured.request = req;
    return {hasRawBody: req.rawBody !== undefined, body: req.body};
  }

  @route(HttpMethod.Get, "/audio")
  async audio(): Promise<Response> {
    const response = new Response();
    response.status = 200;
    response.setHeaders({"content-type": "audio/aac"});
    response.body = buildBinaryPayload(1024);
    return response;
  }
}

// Reference the class so its `@controller`/`@route` side effects run even under aggressive tree-shaking.
void BodiesTestController;

interface LiveServer {
  server: KernelHttpServer;
  baseUrl: string;
}

const appModule = (): AppModuleInterface => ({
  keyname: "test.http-bodies-app",
  importModules: [HttpModule],
  importServices: [],
});

async function bootServer(config: { [key: string]: unknown } = {}): Promise<LiveServer> {
  const kernel = new Kernel();
  await kernel.start(appModule(), {
    "pristine.logging.consoleLoggerActivated": false,
    ...config,
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

describe("KernelHttpServer request and response bodies (live socket)", () => {
  describe("with the default body limit", () => {
    let live: LiveServer;

    beforeAll(async () => {
      live = await bootServer();
    });

    afterAll(async () => {
      await live?.server.stop();
    });

    it("parses a JSON POST into `body` and keeps the exact request text as a Buffer on `rawBody`", async () => {
      const text = JSON.stringify({title: "Café ☕", count: 3, nested: {ok: true}});

      const response = await fetch(`${live.baseUrl}/bodies/json`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: text,
      });
      const result = await readJson(response);

      expect(response.status).toBe(200);
      expect(result.body).toEqual({title: "Café ☕", count: 3, nested: {ok: true}});
      expect(result.rawBodyIsBuffer).toBe(true);
      expect(result.rawBodyUtf8).toBe(text);
      expect(Buffer.isBuffer(captured.request?.rawBody)).toBe(true);
      expect((captured.request!.rawBody as Buffer).equals(Buffer.from(text, "utf8"))).toBe(true);
    });

    it("parses a JSON POST whose Content-Type carries a charset parameter", async () => {
      const response = await fetch(`${live.baseUrl}/bodies/json`, {
        method: "POST",
        headers: {"content-type": "application/json; charset=utf-8"},
        body: JSON.stringify({charset: "yes"}),
      });
      const result = await readJson(response);

      expect(response.status).toBe(200);
      expect(result.body).toEqual({charset: "yes"});
    });

    it("leaves malformed JSON as text on `body`, which networking rejects with 400 before the handler", async () => {
      const before = captured.request;

      const response = await fetch(`${live.baseUrl}/bodies/json`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: "{not json",
      });
      await response.text();

      // `RequestBodyConverterInterceptor` only answers 400 when `body` is a string that is not
      // valid JSON: a Buffer or an object would have passed through to the handler.
      expect(response.status).toBe(400);
      expect(captured.request).toBe(before);
    });

    it("yields the string on `body` for a text/plain POST", async () => {
      const response = await fetch(`${live.baseUrl}/bodies/text`, {
        method: "POST",
        headers: {"content-type": "text/plain; charset=utf-8"},
        body: "hello, world — ünïcödé",
      });
      const result = await readJson(response);

      expect(response.status).toBe(200);
      expect(result.bodyType).toBe("string");
      expect(result.body).toBe("hello, world — ünïcödé");
      expect(result.rawBodyIsBuffer).toBe(true);
    });

    it("decodes a text body with the charset named in the Content-Type", async () => {
      // "é" is 0xE9 in ISO-8859-1 and would be U+FFFD if decoded as UTF-8.
      const latin1 = Buffer.from([0x63, 0x61, 0x66, 0xe9]); // "café"

      const response = await fetch(`${live.baseUrl}/bodies/text`, {
        method: "POST",
        headers: {"content-type": "text/plain; charset=iso-8859-1"},
        body: latin1,
      });
      const result = await readJson(response);

      expect(result.body).toBe("café");
      expect((captured.request!.rawBody as Buffer).equals(latin1)).toBe(true);
    });

    it("delivers a binary audio/aac PUT to the handler as the exact bytes that were sent", async () => {
      const payload = buildBinaryPayload();

      const response = await fetch(`${live.baseUrl}/bodies/binary/segment-1`, {
        method: "PUT",
        headers: {"content-type": "audio/aac"},
        body: payload,
      });
      const result = await readJson(response);

      expect(response.status).toBe(200);
      expect(result.bodyIsBuffer).toBe(true);
      expect(result.length).toBe(payload.length);
      expect(Buffer.isBuffer(captured.body)).toBe(true);
      expect((captured.body as Buffer).equals(payload)).toBe(true);
      expect(Buffer.isBuffer(captured.request?.rawBody)).toBe(true);
      expect((captured.request!.rawBody as Buffer).equals(payload)).toBe(true);
      expect(captured.request!.getRawBodyBuffer()!.equals(payload)).toBe(true);
    });

    it("delivers a body with no Content-Type as an untouched Buffer", async () => {
      const payload = buildBinaryPayload(512);

      await fetch(`${live.baseUrl}/bodies/binary/no-content-type`, {
        method: "PUT",
        headers: {"content-type": ""},
        body: payload,
      }).then(r => r.text());

      expect(Buffer.isBuffer(captured.body)).toBe(true);
      expect((captured.body as Buffer).equals(payload)).toBe(true);
    });

    it("sets neither `body` nor `rawBody` for a zero-length POST", async () => {
      const response = await fetch(`${live.baseUrl}/bodies/empty`, {
        method: "POST",
        headers: {"content-type": "application/json"},
      });
      const result = await readJson(response);

      expect(result.hasRawBody).toBe(false);
      expect(captured.request?.rawBody).toBeUndefined();
      expect(result.body).toEqual({});
    });

    it("serves a Buffer response body byte-for-byte with the handler's Content-Type", async () => {
      const response = await fetch(`${live.baseUrl}/bodies/audio`);
      const bytes = Buffer.from(await response.arrayBuffer());

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("audio/aac");
      expect(bytes.equals(buildBinaryPayload(1024))).toBe(true);
    });
  });

  describe("with a 1 KB body limit", () => {
    let live: LiveServer;

    beforeAll(async () => {
      captured.limitHandlerCalls = 0;
      live = await bootServer({[HttpConfigurationKeys.KernelServerMaxBodySize]: 1024});
    });

    afterAll(async () => {
      await live?.server.stop();
    });

    it("answers 413 for a body over the limit and never calls the handler", async () => {
      const response = await fetch(`${live.baseUrl}/bodies/limited`, {
        method: "POST",
        headers: {"content-type": "application/octet-stream"},
        body: buildBinaryPayload(4096),
      });
      const result = await readJson(response);

      expect(response.status).toBe(413);
      expect(result.error).toBe("Payload Too Large");
      expect(captured.limitHandlerCalls).toBe(0);
    });

    it("answers 413 for a chunked body that grows past the limit", async () => {
      // No Content-Length up front: the server must stop while streaming.
      const chunk = buildBinaryPayload(512);
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          for (let i = 0; i < 8; i++) {
            controller.enqueue(chunk);
          }
          controller.close();
        },
      });

      const response = await fetch(`${live.baseUrl}/bodies/limited`, {
        method: "POST",
        headers: {"content-type": "application/octet-stream"},
        body: stream,
        // @ts-ignore: Node's fetch needs this for a streaming request body.
        duplex: "half",
      }).catch((): undefined => undefined);

      // Depending on timing the client either reads the 413 or sees the connection closed
      // while still writing. Either way the handler must not have run.
      if (response !== undefined) {
        expect(response.status).toBe(413);
        await response.text();
      }
      expect(captured.limitHandlerCalls).toBe(0);
    });

    it("still accepts a body under the limit", async () => {
      const response = await fetch(`${live.baseUrl}/bodies/limited`, {
        method: "POST",
        headers: {"content-type": "application/octet-stream"},
        body: buildBinaryPayload(512),
      });
      const result = await readJson(response);

      expect(response.status).toBe(200);
      expect(result).toEqual({ok: true});
      expect(captured.limitHandlerCalls).toBe(1);
    });
  });
});
