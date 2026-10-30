import {injectable, injectAll} from "tsyringe";
import {injectConfig, moduleScoped, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {McpModuleKeyname} from "../mcp.module.keyname";
import {McpConfigurationKeys} from "../mcp.configuration-keys";
import {McpProtocolVersions} from "../mcp.protocol-versions";
import {McpToolCatalog} from "../managers/mcp-tool.catalog";
import {McpToolInvoker} from "./mcp-tool.invoker";
import {McpProtocolError} from "../errors/mcp-protocol.error";
import {McpToolResult} from "../models/mcp-tool-result.model";
import {JsonRpcErrorCodeEnum} from "../enums/json-rpc-error-code.enum";
import {McpMethodEnum} from "../enums/mcp-method.enum";
import {McpMetaKeyEnum} from "../enums/mcp-meta-key.enum";
import {McpProtocolEraEnum} from "../enums/mcp-protocol-era.enum";
import {McpProtocolVersionEnum} from "../enums/mcp-protocol-version.enum";
import {JsonRpcMessageInterface} from "../interfaces/json-rpc-message.interface";
import {JsonRpcResponseInterface} from "../interfaces/json-rpc-response.interface";
import {McpDispatchOptionsInterface} from "../interfaces/mcp-dispatch-options.interface";
import {McpDispatchResultInterface} from "../interfaces/mcp-dispatch-result.interface";
import {McpImplementationInterface} from "../interfaces/mcp-implementation.interface";
import {McpToolDefinitionInterface} from "../interfaces/mcp-tool-definition.interface";
import {McpToolPolicyInterface} from "../interfaces/mcp-tool-policy.interface";
import {McpToolPolicyContextInterface} from "../interfaces/mcp-tool-policy-context.interface";

/**
 * The protocol core: takes one parsed JSON-RPC message, whatever the transport, and returns the
 * response to send.
 *
 * The server is dual-era and stateless:
 * - A request with `_meta["io.modelcontextprotocol/protocolVersion"]` is modern (2026-07-28):
 *   it is validated and answered on its own, with `resultType` and `serverInfo` in the result.
 * - `initialize` and any request without that key are legacy (2025-11-25 and earlier). The
 *   handshake is answered, but no state is kept: every legacy request is served the same way.
 *
 * Only tools are implemented: `server/discover`, `initialize`, `ping`, `tools/list` and
 * `tools/call`. Any other method is "method not found".
 *
 * Every service tagged `ServiceDefinitionTagEnum.McpToolPolicy` filters the tools: a tool that one
 * policy refuses is not listed, and a call to it is answered as an unknown tool.
 */
@moduleScoped(McpModuleKeyname)
@injectable()
export class McpDispatcher {
  public constructor(private readonly catalog: McpToolCatalog,
                     private readonly invoker: McpToolInvoker,
                     @injectConfig(McpConfigurationKeys.ServerName) private readonly serverName: string,
                     @injectConfig(McpConfigurationKeys.ServerVersion) private readonly serverVersion: string,
                     @injectConfig(McpConfigurationKeys.ServerInstructions) private readonly serverInstructions: string,
                     @injectAll(ServiceDefinitionTagEnum.McpToolPolicy, {isOptional: true}) private readonly policies: McpToolPolicyInterface[] = []) {
  }

  /**
   * Handles one message.
   *
   * @param message The parsed body of the message.
   * @param options The container, identity and cancellation signal of the transport.
   */
  public async dispatch(message: unknown, options: McpDispatchOptionsInterface): Promise<McpDispatchResultInterface> {
    if (this.isMessage(message) === false) {
      return this.errorResult(undefined, new McpProtocolError(JsonRpcErrorCodeEnum.InvalidRequest, "The message is not a JSON-RPC 2.0 request or notification."), McpProtocolEraEnum.Modern);
    }

    // A notification gets no response. `notifications/initialized` needs no action, the transport
    // handles `notifications/cancelled`, and unknown notifications are ignored.
    if (message.id === undefined) {
      return {httpStatus: 202};
    }

    const era = this.era(message);

    try {
      const result = await this.handle(message, era, options);

      return {
        httpStatus: 200,
        response: {jsonrpc: "2.0", id: message.id, result},
      };
    } catch (error) {
      if (error instanceof McpProtocolError) {
        return this.errorResult(message.id, error, era);
      }

      throw error;
    }
  }

  private async handle(message: JsonRpcMessageInterface, era: McpProtocolEraEnum, options: McpDispatchOptionsInterface): Promise<{ [key: string]: unknown }> {
    if (message.method === McpMethodEnum.Initialize) {
      return this.initialize(message);
    }

    const protocolVersion = this.protocolVersion(message, era, options);

    let result: { [key: string]: unknown };

    switch (message.method) {
      case McpMethodEnum.ServerDiscover:
        result = this.discover();
        break;
      case McpMethodEnum.Ping:
        result = {};
        break;
      case McpMethodEnum.ToolsList:
        result = {tools: await this.allowedTools(message, options)};
        break;
      case McpMethodEnum.ToolsCall:
        result = this.serializeToolResult(await this.callTool(message, protocolVersion, options), era, protocolVersion);
        break;
      default:
        throw new McpProtocolError(JsonRpcErrorCodeEnum.MethodNotFound, `Method not found: '${message.method}'.`, 404);
    }

    if (era === McpProtocolEraEnum.Legacy) {
      return result;
    }

    return {
      resultType: "complete",
      ...result,
      _meta: {
        ...(result._meta as object ?? {}),
        [McpMetaKeyEnum.ServerInfo]: this.serverInfo(),
      },
    };
  }

  /**
   * Answers the legacy handshake. The server keeps no session: it agrees on a version and every
   * later request is served statelessly.
   */
  private initialize(message: JsonRpcMessageInterface): { [key: string]: unknown } {
    const requested = message.params?.protocolVersion;

    if (typeof requested !== "string") {
      throw new McpProtocolError(JsonRpcErrorCodeEnum.InvalidParams, "'initialize' requires a 'protocolVersion' string.");
    }

    const result: { [key: string]: unknown } = {
      // Agree on the requested legacy version, else offer the newest legacy one: the client then
      // decides whether it can speak it. A modern-only client never sends `initialize`.
      protocolVersion: McpProtocolVersions.Legacy.includes(requested) ? requested : McpProtocolVersions.Legacy[0],
      capabilities: {tools: {listChanged: false}},
      serverInfo: this.serverInfo(),
    };

    if (this.serverInstructions !== "") {
      result.instructions = this.serverInstructions;
    }

    return result;
  }

  private discover(): { [key: string]: unknown } {
    const result: { [key: string]: unknown } = {
      supportedVersions: McpProtocolVersions.All,
      capabilities: {tools: {}},
    };

    if (this.serverInstructions !== "") {
      result.instructions = this.serverInstructions;
    }

    return result;
  }

  private async callTool(message: JsonRpcMessageInterface, protocolVersion: string, options: McpDispatchOptionsInterface): Promise<McpToolResult> {
    const name = message.params?.name;
    const args = message.params?.arguments ?? {};

    if (typeof name !== "string") {
      throw new McpProtocolError(JsonRpcErrorCodeEnum.InvalidParams, "'tools/call' requires a 'name' string.");
    }

    if (typeof args !== "object" || Array.isArray(args)) {
      throw new McpProtocolError(JsonRpcErrorCodeEnum.InvalidParams, "The 'arguments' of 'tools/call' must be an object.");
    }

    const registration = this.catalog.find(name);

    if (registration === undefined || await this.isAllowed(this.catalog.definition(name)!, this.policyContext(message, options)) === false) {
      throw new McpProtocolError(JsonRpcErrorCodeEnum.InvalidParams, `Unknown tool: '${name}'.`);
    }

    return this.invoker.invoke(registration, args, {
      identity: options.identity,
      signal: options.signal ?? new AbortController().signal,
      protocolVersion,
      clientInfo: message.params?._meta?.[McpMetaKeyEnum.ClientInfo],
    }, options.container);
  }

  private async allowedTools(message: JsonRpcMessageInterface, options: McpDispatchOptionsInterface): Promise<McpToolDefinitionInterface[]> {
    const tools = this.catalog.list();

    if (this.policies.length === 0) {
      return tools;
    }

    const context = this.policyContext(message, options);
    const allowed = await Promise.all(tools.map(tool => this.isAllowed(tool, context)));

    return tools.filter((tool, index) => allowed[index]);
  }

  private async isAllowed(tool: McpToolDefinitionInterface, context: McpToolPolicyContextInterface): Promise<boolean> {
    for (const policy of this.policies) {
      if (await policy.isToolAllowed(tool, context) === false) {
        return false;
      }
    }

    return true;
  }

  private policyContext(message: JsonRpcMessageInterface, options: McpDispatchOptionsInterface): McpToolPolicyContextInterface {
    return {
      identity: options.identity,
      clientInfo: message.params?._meta?.[McpMetaKeyEnum.ClientInfo],
    };
  }

  private serializeToolResult(toolResult: McpToolResult, era: McpProtocolEraEnum, protocolVersion: string): { [key: string]: unknown } {
    const result: { [key: string]: unknown } = {
      content: toolResult.content,
      isError: toolResult.isError,
    };

    if (toolResult.structuredContent === undefined) {
      return result;
    }

    // 2025-03-26 has no structured content, and the other legacy versions accept only an object.
    const isObject = typeof toolResult.structuredContent === "object" && toolResult.structuredContent !== null && Array.isArray(toolResult.structuredContent) === false;

    if (era === McpProtocolEraEnum.Modern || (protocolVersion !== McpProtocolVersionEnum.V2025_03_26 && isObject)) {
      result.structuredContent = toolResult.structuredContent;
    }

    return result;
  }

  /**
   * Returns the version of the request. A version in `_meta` wins; a legacy request without one
   * uses the version the transport knows, else the oldest legacy version.
   */
  private protocolVersion(message: JsonRpcMessageInterface, era: McpProtocolEraEnum, options: McpDispatchOptionsInterface): string {
    const meta = message.params?._meta;
    const requested = meta?.[McpMetaKeyEnum.ProtocolVersion];

    if (requested === undefined) {
      const version = options.legacyProtocolVersion;

      return version !== undefined && McpProtocolVersions.Legacy.includes(version) ? version : McpProtocolVersions.LegacyDefault;
    }

    if (typeof requested !== "string" || McpProtocolVersions.All.includes(requested) === false) {
      throw new McpProtocolError(JsonRpcErrorCodeEnum.UnsupportedProtocolVersion, "Unsupported protocol version", 400, {
        supported: McpProtocolVersions.All,
        requested,
      });
    }

    const capabilities = meta[McpMetaKeyEnum.ClientCapabilities];

    if (era === McpProtocolEraEnum.Modern && (typeof capabilities !== "object" || capabilities === null || Array.isArray(capabilities))) {
      throw new McpProtocolError(JsonRpcErrorCodeEnum.InvalidParams, `The request '_meta' requires '${McpMetaKeyEnum.ClientCapabilities}'.`);
    }

    return requested;
  }

  /**
   * A request is modern when its `_meta` names a modern version, or a version this server does not
   * know (so the refusal is a modern error the client can recognize). `initialize`, a request
   * without a version and a request naming a legacy version are served with legacy semantics.
   */
  private era(message: JsonRpcMessageInterface): McpProtocolEraEnum {
    if (message.method === McpMethodEnum.Initialize) {
      return McpProtocolEraEnum.Legacy;
    }

    const requested = message.params?._meta?.[McpMetaKeyEnum.ProtocolVersion];

    if (requested === undefined || McpProtocolVersions.Legacy.includes(requested)) {
      return McpProtocolEraEnum.Legacy;
    }

    return McpProtocolEraEnum.Modern;
  }

  private errorResult(id: string | number | undefined, error: McpProtocolError, era: McpProtocolEraEnum): McpDispatchResultInterface {
    // An error with no readable request id carries no `id` at all: MCP never sends a null id.
    const response: JsonRpcResponseInterface = {
      jsonrpc: "2.0",
      ...(id === undefined ? {} : {id}),
      error: {code: error.jsonRpcCode, message: error.message},
    };

    if (error.data !== undefined) {
      response.error!.data = error.data;
    }

    // Legacy clients read JSON-RPC errors from a 200; only an unreadable message is a 400.
    const isUnreadable = error.jsonRpcCode === JsonRpcErrorCodeEnum.InvalidRequest || error.jsonRpcCode === JsonRpcErrorCodeEnum.ParseError;
    const httpStatus = era === McpProtocolEraEnum.Modern || isUnreadable ? error.options.httpStatus ?? 400 : 200;

    return {response, httpStatus};
  }

  private isMessage(message: unknown): message is JsonRpcMessageInterface {
    if (typeof message !== "object" || message === null || Array.isArray(message)) {
      return false;
    }

    const candidate = message as { [key: string]: unknown };

    if (candidate.jsonrpc !== "2.0" || typeof candidate.method !== "string") {
      return false;
    }

    if (candidate.id !== undefined && typeof candidate.id !== "string" && typeof candidate.id !== "number") {
      return false;
    }

    return candidate.params === undefined || (typeof candidate.params === "object" && candidate.params !== null && Array.isArray(candidate.params) === false);
  }

  private serverInfo(): McpImplementationInterface {
    return {name: this.serverName, version: this.serverVersion};
  }
}
