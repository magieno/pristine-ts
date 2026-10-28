import "reflect-metadata";
import {PassThrough} from "stream";
import {injectable} from "tsyringe";
import {AppModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {Kernel} from "@pristine-ts/core";
import {McpModule} from "../mcp.module";
import {McpStdioTransport} from "./mcp-stdio.transport";
import {McpDispatcher} from "../dispatchers/mcp.dispatcher";
import {mcpTool} from "../decorators/mcp-tool.decorator";
import {McpToolContextInterface} from "../interfaces/mcp-tool-context.interface";

let releaseSlowCall: () => void;
let slowCallSignal: AbortSignal | undefined;

@injectable()
class SlowTools {
  @mcpTool({name: "slow", description: "Wait until released."})
  async slow(input: unknown, context: McpToolContextInterface) {
    slowCallSignal = context.signal;
    await new Promise<void>(resolve => releaseSlowCall = resolve);
    return "slow done";
  }

  @mcpTool({name: "fast", description: "Answer at once."})
  fast(input: unknown, context: McpToolContextInterface) {
    return `fast for ${context.identity?.id ?? "nobody"}`;
  }

  @mcpTool({name: "multiline", description: "Answer on several lines."})
  multiline() {
    return "line 1\nline 2";
  }
}

describe("McpStdioTransport", () => {
  let kernel: Kernel;
  let transport: McpStdioTransport;

  const run = (identity?: { id: string, claims: {} }) => {
    const input = new PassThrough();
    const output = new PassThrough();
    const lines: any[] = [];
    let buffered = "";

    output.on("data", chunk => {
      buffered += chunk.toString();
      const parts = buffered.split("\n");
      buffered = parts.pop()!;
      lines.push(...parts.map(part => JSON.parse(part)));
    });

    const done = transport.listen(input, output, identity);
    const send = (message: unknown) => input.write((typeof message === "string" ? message : JSON.stringify(message)) + "\n");

    return {input, lines, done, send};
  };

  const flush = () => new Promise(resolve => setImmediate(resolve));

  beforeAll(async () => {
    kernel = new Kernel();
    await kernel.start({keyname: "mcp.stdio.test", importModules: [McpModule], providerRegistrations: []} as AppModuleInterface, {
      "pristine.logging.consoleLoggerActivated": false,
    });
    kernel.container.register(ServiceDefinitionTagEnum.CurrentChildContainer, {useValue: kernel.container});
    transport = kernel.container.resolve(McpStdioTransport);
  });

  it("should answer each request on its own line and resolve when the input closes", async () => {
    const {input, lines, done, send} = run({id: "user-1", claims: {}});

    send({jsonrpc: "2.0", id: 1, method: "initialize", params: {protocolVersion: "2025-11-25"}});
    send({jsonrpc: "2.0", method: "notifications/initialized"});
    send("");
    send({jsonrpc: "2.0", id: 2, method: "tools/call", params: {name: "fast"}});
    send({jsonrpc: "2.0", id: 3, method: "tools/call", params: {name: "multiline"}});
    input.end();
    await done;

    expect(lines.map(line => line.id)).toEqual([1, 2, 3]);
    expect(lines[0].result.protocolVersion).toBe("2025-11-25");
    expect(lines[1].result.content).toEqual([{type: "text", text: "fast for user-1"}]);
    expect(lines[2].result.content).toEqual([{type: "text", text: "line 1\nline 2"}]);
  });

  it("should answer invalid JSON with -32700 and keep serving", async () => {
    const {input, lines, done, send} = run();

    send("{not json");
    send({jsonrpc: "2.0", id: 1, method: "ping"});
    input.end();
    await done;

    expect(lines).toEqual([
      {jsonrpc: "2.0", error: {code: -32700, message: expect.any(String)}},
      {jsonrpc: "2.0", id: 1, result: {}},
    ]);
  });

  it("should serve requests concurrently", async () => {
    const {input, lines, done, send} = run();

    send({jsonrpc: "2.0", id: "slow", method: "tools/call", params: {name: "slow"}});
    send({jsonrpc: "2.0", id: "fast", method: "tools/call", params: {name: "fast"}});
    await flush();
    await flush();

    expect(lines.map(line => line.id)).toEqual(["fast"]);

    releaseSlowCall();
    input.end();
    await done;

    expect(lines.map(line => line.id)).toEqual(["fast", "slow"]);
  });

  it("should abort a cancelled call and write nothing more for it", async () => {
    const {input, lines, done, send} = run();

    send({jsonrpc: "2.0", id: 7, method: "tools/call", params: {name: "slow"}});
    await flush();
    await flush();
    send({jsonrpc: "2.0", method: "notifications/cancelled", params: {requestId: 7, reason: "user"}});
    await flush();

    expect(slowCallSignal!.aborted).toBe(true);

    releaseSlowCall();
    input.end();
    await done;

    expect(lines).toEqual([]);
  });

  it("should answer -32603 when the dispatcher throws", async () => {
    const dispatcher = kernel.container.resolve(McpDispatcher);
    const failing = new McpStdioTransport(dispatcher, kernel.container, {error: jest.fn()} as any);
    jest.spyOn(dispatcher, "dispatch").mockRejectedValueOnce(new Error("boom"));

    const input = new PassThrough();
    const output = new PassThrough();
    let written = "";
    output.on("data", chunk => written += chunk.toString());

    const done = failing.listen(input, output);
    input.write(JSON.stringify({jsonrpc: "2.0", id: 9, method: "ping"}) + "\n");
    input.end();
    await done;

    expect(JSON.parse(written)).toEqual({jsonrpc: "2.0", id: 9, error: {code: -32603, message: "Internal error."}});
  });
});
