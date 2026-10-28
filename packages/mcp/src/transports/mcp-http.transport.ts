import {DependencyContainer, inject, injectable} from "tsyringe";
import {HttpMethod, IdentityInterface, injectConfig, moduleScoped, Request, Response, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {McpModuleKeyname} from "../mcp.module.keyname";
import {McpConfigurationKeys} from "../mcp.configuration-keys";
import {McpProtocolVersions} from "../mcp.protocol-versions";
import {McpDispatcher} from "../dispatchers/mcp.dispatcher";
import {JsonRpcErrorCodeEnum} from "../enums/json-rpc-error-code.enum";
import {McpHttpHeaderEnum} from "../enums/mcp-http-header.enum";
import {McpMetaKeyEnum} from "../enums/mcp-meta-key.enum";
import {McpMethodEnum} from "../enums/mcp-method.enum";

/**
 * The Streamable HTTP transport. Pristine owns the HTTP server and the routing, so this class
 * only turns one `Request` into one `Response`: serve it from a controller of your own.
 *
 * ```ts
 * @controller("/mcp")
 * export class McpController {
 *   constructor(private readonly mcpHttpTransport: McpHttpTransport) {}
 *
 *   @route(HttpMethod.Post, "")
 *   post(@request() request: Request, @identity() identity?: IdentityInterface) {
 *     return this.mcpHttpTransport.handle(request, identity);
 *   }
 *
 *   // Legacy clients probe with GET and DELETE; the transport answers 405.
 *   @route(HttpMethod.Get, "")
 *   get(@request() request: Request) {
 *     return this.mcpHttpTransport.handle(request);
 *   }
 * }
 * ```
 *
 * The controller keeps everything the router already does: authentication, authorization and
 * the request context. The transport adds what MCP requires:
 * - `Origin` validation against `pristine.mcp.http.allowedOrigins` (403 otherwise).
 * - POST only: GET and DELETE get a 405, since there is no server stream and no session.
 * - For a modern request, the `MCP-Protocol-Version`, `Mcp-Method` and `Mcp-Name` headers must
 *   match the body (400 with `HeaderMismatch` otherwise).
 * - Every response is a single JSON object (no SSE).
 */
@moduleScoped(McpModuleKeyname)
@injectable()
export class McpHttpTransport {
  private readonly allowedOrigins: string[];

  public constructor(private readonly dispatcher: McpDispatcher,
                     @inject(ServiceDefinitionTagEnum.CurrentChildContainer) private readonly container: DependencyContainer,
                     @injectConfig(McpConfigurationKeys.HttpAllowedOrigins) allowedOrigins: string | string[]) {
    this.allowedOrigins = (Array.isArray(allowedOrigins) ? allowedOrigins : String(allowedOrigins ?? "").split(","))
      .map(origin => origin.trim())
      .filter(origin => origin !== "");
  }

  /**
   * @param request The HTTP request received on the MCP endpoint.
   * @param identity The authenticated caller, passed on to the tools.
   */
  public async handle(request: Request, identity?: IdentityInterface): Promise<Response> {
    const origin = request.getHeader(McpHttpHeaderEnum.Origin);

    if (origin !== undefined && this.allowedOrigins.includes(origin) === false) {
      return this.errorResponse(403, JsonRpcErrorCodeEnum.InvalidRequest, `The origin '${origin}' is not allowed.`);
    }

    if (request.httpMethod.toUpperCase() !== HttpMethod.Post.toUpperCase()) {
      const response = this.errorResponse(405, JsonRpcErrorCodeEnum.InvalidRequest, "The MCP endpoint accepts POST only.");
      response.setHeader("Allow", "POST");
      return response;
    }

    let message: any;

    try {
      message = this.parseBody(request);
    } catch {
      return this.errorResponse(400, JsonRpcErrorCodeEnum.ParseError, "The body is not valid JSON.");
    }

    const rejection = this.validateHeaders(request, message);

    if (rejection !== undefined) {
      return rejection;
    }

    const result = await this.dispatcher.dispatch(message, {
      container: this.container,
      identity,
      legacyProtocolVersion: request.getHeader(McpHttpHeaderEnum.ProtocolVersion),
    });

    const response = new Response();
    response.status = result.httpStatus;
    response.request = request;

    if (result.response !== undefined) {
      response.body = result.response;
      response.setHeader("Content-Type", "application/json");
    }

    return response;
  }

  /**
   * The networking interceptors usually parse a JSON body already; accept the raw forms too.
   */
  private parseBody(request: Request): unknown {
    const body = request.body;

    if (Buffer.isBuffer(body)) {
      return JSON.parse(body.toString("utf8"));
    }

    if (typeof body === "string") {
      return JSON.parse(body);
    }

    return body;
  }

  /**
   * Returns the response refusing the request, or `undefined` when its headers are acceptable.
   */
  private validateHeaders(request: Request, message: any): Response | undefined {
    // Notifications carry no header requirement, and a malformed message is left to the dispatcher.
    if (typeof message !== "object" || message === null || message.id === undefined) {
      return undefined;
    }

    const headerVersion = request.getHeader(McpHttpHeaderEnum.ProtocolVersion);
    const bodyVersion = message.params?._meta?.[McpMetaKeyEnum.ProtocolVersion];

    if (bodyVersion === undefined) {
      if (headerVersion === undefined || McpProtocolVersions.Legacy.includes(headerVersion)) {
        return undefined;
      }

      if (McpProtocolVersions.Modern.includes(headerVersion)) {
        return this.errorResponse(400, JsonRpcErrorCodeEnum.InvalidParams, `The request '_meta' requires '${McpMetaKeyEnum.ProtocolVersion}'.`, message.id);
      }

      return this.errorResponse(400, JsonRpcErrorCodeEnum.UnsupportedProtocolVersion, "Unsupported protocol version", message.id, {
        supported: McpProtocolVersions.All,
        requested: headerVersion,
      });
    }

    if (headerVersion !== bodyVersion) {
      return this.headerMismatch(message.id, `Header mismatch: MCP-Protocol-Version header value '${headerVersion ?? ""}' does not match body value '${bodyVersion}'.`);
    }

    // The mirrored-header rules belong to the modern revision only.
    if (McpProtocolVersions.Modern.includes(bodyVersion) === false) {
      return undefined;
    }

    const headerMethod = request.getHeader(McpHttpHeaderEnum.Method);

    if (headerMethod !== message.method) {
      return this.headerMismatch(message.id, `Header mismatch: Mcp-Method header value '${headerMethod ?? ""}' does not match body value '${message.method}'.`);
    }

    if (message.method === McpMethodEnum.ToolsCall) {
      const headerName = this.decodeHeaderValue(request.getHeader(McpHttpHeaderEnum.Name));

      if (headerName !== message.params?.name) {
        return this.headerMismatch(message.id, `Header mismatch: Mcp-Name header value '${headerName ?? ""}' does not match body value '${message.params?.name}'.`);
      }
    }

    return undefined;
  }

  /**
   * Decodes the `=?base64?...?=` sentinel clients use for a value that is not plain ASCII.
   */
  private decodeHeaderValue(value: string | undefined): string | undefined {
    if (value === undefined || value.startsWith("=?base64?") === false || value.endsWith("?=") === false) {
      return value;
    }

    return Buffer.from(value.slice("=?base64?".length, -"?=".length), "base64").toString("utf8");
  }

  private headerMismatch(id: string | number, message: string): Response {
    return this.errorResponse(400, JsonRpcErrorCodeEnum.HeaderMismatch, message, id);
  }

  private errorResponse(status: number, code: JsonRpcErrorCodeEnum, message: string, id?: string | number, data?: unknown): Response {
    const response = new Response();
    response.status = status;
    // An error with no readable request id carries no `id` at all: MCP never sends a null id.
    response.body = {
      jsonrpc: "2.0",
      ...(id === undefined ? {} : {id}),
      error: data === undefined ? {code, message} : {code, message, data},
    };
    response.setHeader("Content-Type", "application/json");

    return response;
  }
}
