import {inject, injectable} from "tsyringe";
import http, {IncomingMessage, Server, ServerResponse} from "http";
import https from "https";
import fs from "fs";
import {URL} from "url";
import {v4 as uuidv4} from "uuid";
import {ExecutionContextKeynameEnum, Kernel, RuntimeServerInterface} from "@pristine-ts/core";
import {moduleScoped, Request, Response, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {HttpModuleKeyname} from "../http.module.keyname";

/**
 * Per-request override of the start-time bound port/address pair. Both are optional — when
 * absent, the server falls back to the values resolved from `pristine.http.kernel-server.*`
 * configuration.
 */
export interface KernelHttpServerStartOptions {
  port?: number;
  address?: string;
  tls?: {
    keyPath: string;
    certPath: string;
  };
}

/**
 * Wraps Node's `http.Server` (or `https.Server` when TLS config is present) and routes every
 * incoming request through `kernel.handle()`. The kernel dispatches to the existing
 * `RequestEventHandler` from `@pristine-ts/networking`, which finds the matching controller
 * via the `Router` — so all the routing/auth/interceptor logic the consumer already has on
 * their controllers Just Works without any new framework concepts.
 *
 * Designed to be the runtime entry point for `pristine start`. Lifecycle:
 *   - `start({port, address, tls?})` creates the underlying server and binds.
 *   - `stop()` calls `server.close()`, which lets in-flight requests finish but refuses new
 *     connections — exactly what `Kernel.stop()`'s graceful-shutdown contract expects.
 *
 * Multiple `stop()` calls are safe (no-op after the first). `start()` is idempotent in the
 * sense that calling it twice without an intervening `stop()` rejects with a clear error
 * rather than silently leaking the previous server.
 */
@tag(ServiceDefinitionTagEnum.RuntimeServer)
@moduleScoped(HttpModuleKeyname)
@injectable()
export class KernelHttpServer implements RuntimeServerInterface {
  /**
   * Identifier reported back via `RuntimeServerInterface.name`. Switches to `"https"` when
   * TLS config is present, mainly so log lines and `pristine info`-style introspection make
   * the protocol obvious without inspecting the server object.
   */
  public name: string = "http";

  /**
   * Underlying Node server. Undefined until `start()` is called, undefined again after `stop()`.
   * @private
   */
  private server?: Server;

  /**
   * Set of currently-open connections. Tracked so `stop()` can choose to destroy them after
   * a grace period rather than waiting indefinitely for keep-alive sockets to close on their own.
   * @private
   */
  private readonly connections: Set<import("net").Socket> = new Set();

  constructor(
    @inject(`%${HttpModuleKeyname}.kernel-server.address%`) private readonly defaultAddress: string,
    @inject(`%${HttpModuleKeyname}.kernel-server.port%`) private readonly defaultPort: number,
    @inject(`%${HttpModuleKeyname}.kernel-server.tls.key-path%`) private readonly defaultTlsKeyPath: string,
    @inject(`%${HttpModuleKeyname}.kernel-server.tls.cert-path%`) private readonly defaultTlsCertPath: string,
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    private readonly kernel: Kernel,
  ) {
  }

  /**
   * Binds the server. Resolves once the underlying server is listening; rejects on bind error
   * (port in use, EACCES, etc).
   *
   * The `tls` option, when present and pointing at readable PEM files, switches the server
   * from plain HTTP to HTTPS. When absent, configuration-time `kernel-server.tls.*` values
   * are consulted as a fallback.
   */
  async start(options?: KernelHttpServerStartOptions): Promise<void> {
    if (this.server !== undefined) {
      throw new Error("[KernelHttpServer] start() called while a server is already running. Call stop() first.");
    }

    const port = options?.port ?? this.defaultPort;
    const address = options?.address ?? this.defaultAddress;

    const tlsKeyPath = options?.tls?.keyPath ?? this.defaultTlsKeyPath;
    const tlsCertPath = options?.tls?.certPath ?? this.defaultTlsCertPath;
    const tlsEnabled = tlsKeyPath !== "" && tlsCertPath !== "";

    const handler = (req: IncomingMessage, res: ServerResponse) => {
      // Don't await — letting requests run concurrently is the whole point of an HTTP server.
      // handleRequest swallows its own errors so an unhandled rejection cannot crash the process.
      void this.handleRequest(req, res);
    };

    if (tlsEnabled) {
      const key = fs.readFileSync(tlsKeyPath);
      const cert = fs.readFileSync(tlsCertPath);
      this.server = https.createServer({key, cert}, handler);
      this.name = "https";
    } else {
      this.server = http.createServer(handler);
      this.name = "http";
    }

    // Track every open connection so stop() can force them closed if they outlive the grace
    // window. Without this, keep-alive sockets pin server.close() open indefinitely.
    this.server.on("connection", (socket) => {
      this.connections.add(socket);
      socket.on("close", () => this.connections.delete(socket));
    });

    return new Promise<void>((resolve, reject) => {
      const onError = (err: Error) => {
        this.server?.removeListener("listening", onListening);
        this.server = undefined;
        reject(err);
      };
      const onListening = () => {
        this.server?.removeListener("error", onError);
        const scheme = tlsEnabled ? "https" : "http";
        this.logHandler.info(`KernelHttpServer: listening on ${scheme}://${address}:${port}`);
        resolve();
      };
      this.server!.once("error", onError);
      this.server!.once("listening", onListening);
      this.server!.listen(port, address);
    });
  }

  /**
   * Shuts the server down. Calls `server.close()` to refuse new connections, then waits for
   * in-flight requests to drain. Idempotent — calling it without a running server is a no-op.
   */
  async stop(options?: {drainTimeoutMs?: number}): Promise<void> {
    if (this.server === undefined) {
      return;
    }
    const server = this.server;
    this.server = undefined;

    const drainTimeoutMs = options?.drainTimeoutMs ?? 10_000;

    return new Promise<void>((resolve) => {
      const closeTimer = setTimeout(() => {
        // Drain window expired — force-close remaining sockets so close() can resolve.
        this.logHandler.warning(
          `KernelHttpServer: drain timeout (${drainTimeoutMs}ms) reached, forcing ${this.connections.size} open connection(s) closed.`
        );
        for (const socket of this.connections) {
          socket.destroy();
        }
      }, drainTimeoutMs);
      closeTimer.unref();

      server.close(() => {
        clearTimeout(closeTimer);
        this.connections.clear();
        this.logHandler.info("KernelHttpServer: stopped.");
        resolve();
      });
    });
  }

  /**
   * Reads the body, builds a Pristine `Request`, dispatches via the kernel, writes the
   * resulting `Response`. All errors are caught and turned into a 500 response so the
   * caller's request always gets an answer.
   * @private
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const requestId = (req.headers["x-pristine-request-id"] as string | undefined) ?? uuidv4();

    try {
      const request = await this.mapToPristineRequest(req, requestId);
      const result = await this.kernel.handle(request, {
        keyname: ExecutionContextKeynameEnum.Http,
        context: null,
      }) as Response | object;

      this.writeResponse(res, result);
    } catch (error) {
      this.logHandler.error("KernelHttpServer: unhandled error while processing request", {
        extra: {error, url: req.url, method: req.method, requestId},
      });
      // Best-effort 500. If headers are already sent the response is partially written and we
      // can only destroy the socket — but most kernel.handle errors propagate before any write.
      if (res.headersSent === false) {
        res.statusCode = 500;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({error: "Internal Server Error", requestId}));
      } else {
        res.destroy();
      }
    }
  }

  /**
   * Reads the request body to completion and constructs a Pristine `Request`. The body is read
   * as a UTF-8 string and JSON-parsed when the content-type is JSON-flavored; otherwise the
   * raw string is kept on `body`. `rawBody` always carries the unparsed string so handlers can
   * re-parse if needed (e.g. signature verification).
   * @private
   */
  private async mapToPristineRequest(req: IncomingMessage, requestId: string): Promise<Request> {
    const url = req.url ?? "/";
    const method = (req.method ?? "GET").toUpperCase();
    const groupId = req.headers["x-pristine-event-group-id"] as string | undefined;

    const request = new Request(method, url, requestId);
    request.groupId = groupId;

    // The networking Router treats `request.host` as a base URL for `new URL(request.url, host)`,
    // which requires a scheme. Node's `Host` header carries only the authority (host:port), so
    // we prefix the appropriate scheme based on whether the underlying server is TLS-encrypted.
    const hostHeader = req.headers.host;
    if (hostHeader !== undefined) {
      const scheme = (req.socket as any).encrypted === true ? "https" : "http";
      request.host = `${scheme}://${hostHeader}`;
    }

    const headers: { [k: string]: string } = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) {
        headers[k] = v.join(", ");
      } else if (v !== undefined) {
        headers[k] = String(v);
      }
    }
    request.setHeaders(headers);

    if (method !== "GET" && method !== "HEAD") {
      const rawBody = await this.readBody(req);
      request.rawBody = rawBody;

      const contentType = (req.headers["content-type"] ?? "").toLowerCase();
      if (rawBody.length > 0 && contentType.includes("application/json")) {
        try {
          request.body = JSON.parse(rawBody);
        } catch {
          // Malformed JSON — keep the raw string on `body` so handlers can decide how to react.
          request.body = rawBody;
        }
      } else {
        request.body = rawBody;
      }
    }

    return request;
  }

  /**
   * Drains `req` into a UTF-8 string. Bounded by Node's default request size — the `http`
   * module already enforces `maxHeaderSize` and the consumer can layer on body-size checks
   * via the networking package's interceptors if needed.
   * @private
   */
  private readBody(req: IncomingMessage): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      req.on("error", reject);
    });
  }

  /**
   * Writes a Pristine `Response` (or any object — handlers that return raw JSON serialize as-is)
   * back to the underlying `ServerResponse`. Default status is 200, default content-type is
   * `application/json` when the body is non-string.
   * @private
   */
  private writeResponse(res: ServerResponse, result: Response | any): void {
    const isPristineResponse = result instanceof Response || (
      result !== null && typeof result === "object" && typeof (result as any).status === "number" && "body" in result
    );

    const status = isPristineResponse ? (result.status ?? 200) : 200;
    const headers = isPristineResponse ? (result.headers ?? {}) : {};
    const body = isPristineResponse ? result.body : result;

    res.statusCode = status;

    let serializedBody: string;
    if (body === undefined || body === null) {
      serializedBody = "";
    } else if (typeof body === "string") {
      serializedBody = body;
    } else if (Buffer.isBuffer(body)) {
      // Buffer body: write directly without re-encoding. Don't auto-set content-type — the
      // handler that produced a Buffer is presumed to know what it's sending.
      this.applyHeaders(res, headers);
      res.end(body);
      return;
    } else {
      serializedBody = JSON.stringify(body);
      if (this.getHeader(headers, "content-type") === undefined) {
        headers["content-type"] = "application/json";
      }
    }

    this.applyHeaders(res, headers);
    res.end(serializedBody);
  }

  private applyHeaders(res: ServerResponse, headers: { [k: string]: string }): void {
    for (const [name, value] of Object.entries(headers)) {
      res.setHeader(name, value);
    }
  }

  private getHeader(headers: { [k: string]: string }, name: string): string | undefined {
    const lower = name.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === lower) {
        return v;
      }
    }
    return undefined;
  }
}
