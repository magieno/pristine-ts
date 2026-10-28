import "reflect-metadata";
import {injectable} from "tsyringe";
import {AppModuleInterface, HttpMethod, Request, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {Kernel} from "@pristine-ts/core";
import {IsString} from "@pristine-ts/class-validator";
import {McpModule} from "../mcp.module";
import {McpHttpTransport} from "./mcp-http.transport";
import {mcpTool} from "../decorators/mcp-tool.decorator";
import {McpToolContextInterface} from "../interfaces/mcp-tool-context.interface";

class EchoInput {
  @IsString()
  text: string;
}

@injectable()
class EchoTools {
  @mcpTool({name: "echo", description: "Echo.", inputType: EchoInput})
  echo(input: EchoInput, context: McpToolContextInterface) {
    return `${input.text} from ${context.identity?.id ?? "nobody"}`;
  }
}

const meta = {
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientCapabilities": {},
};

const request = (body: unknown, headers: { [key: string]: string } = {}, method: string = HttpMethod.Post): Request => {
  const created = new Request(method, "http://127.0.0.1/mcp", "request-id");
  created.body = body;
  created.setHeaders(headers);
  return created;
};

const modernHeaders = (method: string, name?: string): { [key: string]: string } => ({
  "MCP-Protocol-Version": "2026-07-28",
  "Mcp-Method": method,
  ...(name === undefined ? {} : {"Mcp-Name": name}),
});

describe("McpHttpTransport", () => {
  let transport: McpHttpTransport;

  beforeAll(async () => {
    const kernel = new Kernel();
    await kernel.start({keyname: "mcp.http.test", importModules: [McpModule], providerRegistrations: []} as AppModuleInterface, {
      "pristine.mcp.http.allowedOrigins": "https://app.example.com, https://other.example.com",
      "pristine.logging.consoleLoggerActivated": false,
    });
    kernel.container.register(ServiceDefinitionTagEnum.CurrentChildContainer, {useValue: kernel.container});
    transport = kernel.container.resolve(McpHttpTransport);
  });

  it("should serve a modern tools/call and pass the identity to the tool", async () => {
    const response = await transport.handle(request(
      {jsonrpc: "2.0", id: 1, method: "tools/call", params: {name: "echo", arguments: {text: "hi"}, _meta: meta}},
      modernHeaders("tools/call", "echo"),
    ), {id: "user-1", claims: {}});

    expect(response.status).toBe(200);
    expect(response.getHeader("Content-Type")).toBe("application/json");
    expect(response.body.result.content).toEqual([{type: "text", text: "hi from user-1"}]);
  });

  it("should parse a string or Buffer body and refuse invalid JSON with -32700", async () => {
    const body = JSON.stringify({jsonrpc: "2.0", id: 1, method: "ping"});

    expect((await transport.handle(request(body))).status).toBe(200);
    expect((await transport.handle(request(Buffer.from(body)))).status).toBe(200);

    const invalid = await transport.handle(request("{not json"));
    expect(invalid.status).toBe(400);
    expect(invalid.body).toEqual({jsonrpc: "2.0", error: {code: -32700, message: expect.any(String)}});
  });

  it("should answer a notification with a 202 and no body", async () => {
    const response = await transport.handle(request({jsonrpc: "2.0", method: "notifications/initialized"}));

    expect(response.status).toBe(202);
    expect(response.body).toBeUndefined();
  });

  it("should refuse an origin that is not allowed with a 403, and accept an allowed one", async () => {
    const refused = await transport.handle(request({jsonrpc: "2.0", id: 1, method: "ping"}, {Origin: "https://evil.example.com"}));
    const allowed = await transport.handle(request({jsonrpc: "2.0", id: 1, method: "ping"}, {Origin: "https://other.example.com"}));

    expect(refused.status).toBe(403);
    expect(refused.body.id).toBeUndefined();
    expect(allowed.status).toBe(200);
  });

  it("should answer GET and DELETE with a 405 and an Allow header", async () => {
    for (const method of [HttpMethod.Get, HttpMethod.Delete]) {
      const response = await transport.handle(request(undefined, {}, method));

      expect(response.status).toBe(405);
      expect(response.getHeader("Allow")).toBe("POST");
    }
  });

  it("should refuse a modern request whose headers do not match the body with -32020", async () => {
    const cases: Array<[unknown, { [key: string]: string }]> = [
      [{jsonrpc: "2.0", id: 1, method: "tools/list", params: {_meta: meta}}, {"Mcp-Method": "tools/list"}],
      [{jsonrpc: "2.0", id: 1, method: "tools/list", params: {_meta: meta}}, modernHeaders("tools/call")],
      [{jsonrpc: "2.0", id: 1, method: "tools/call", params: {name: "echo", _meta: meta}}, modernHeaders("tools/call")],
      [{jsonrpc: "2.0", id: 1, method: "tools/call", params: {name: "echo", _meta: meta}}, modernHeaders("tools/call", "other")],
    ];

    for (const [body, headers] of cases) {
      const response = await transport.handle(request(body, headers));

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe(-32020);
      expect(response.body.id).toBe(1);
    }
  });

  it("should decode a base64 Mcp-Name before comparing it", async () => {
    const response = await transport.handle(request(
      {jsonrpc: "2.0", id: 1, method: "tools/call", params: {name: "echo", arguments: {text: "hi"}, _meta: meta}},
      modernHeaders("tools/call", `=?base64?${Buffer.from("echo").toString("base64")}?=`),
    ));

    expect(response.status).toBe(200);
    expect(response.body.result.content).toEqual([{type: "text", text: "hi from nobody"}]);
  });

  it("should serve a legacy request with or without a legacy version header", async () => {
    const withHeader = await transport.handle(request({jsonrpc: "2.0", id: 1, method: "tools/list"}, {"MCP-Protocol-Version": "2025-06-18"}));
    const withoutHeader = await transport.handle(request({jsonrpc: "2.0", id: 1, method: "tools/list"}));

    expect(withHeader.status).toBe(200);
    expect(withHeader.body.result.resultType).toBeUndefined();
    expect(withoutHeader.status).toBe(200);
  });

  it("should refuse a request that announces a modern version only in the header", async () => {
    const response = await transport.handle(request({jsonrpc: "2.0", id: 1, method: "tools/list"}, {"MCP-Protocol-Version": "2026-07-28"}));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe(-32602);
  });

  it("should refuse an unknown version header with -32022", async () => {
    const response = await transport.handle(request({jsonrpc: "2.0", id: 1, method: "tools/list"}, {"MCP-Protocol-Version": "1900-01-01"}));

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual({
      code: -32022,
      message: "Unsupported protocol version",
      data: {supported: ["2026-07-28", "2025-11-25", "2025-06-18", "2025-03-26"], requested: "1900-01-01"},
    });
  });

  it("should not check the mirrored headers of a request whose _meta names a legacy version", async () => {
    const response = await transport.handle(request(
      {jsonrpc: "2.0", id: 1, method: "tools/list", params: {_meta: {"io.modelcontextprotocol/protocolVersion": "2025-11-25"}}},
      {"MCP-Protocol-Version": "2025-11-25"},
    ));

    expect(response.status).toBe(200);
  });

  it("should leave a malformed message to the dispatcher", async () => {
    const response = await transport.handle(request([{jsonrpc: "2.0", id: 1, method: "ping"}]));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe(-32600);
  });
});
