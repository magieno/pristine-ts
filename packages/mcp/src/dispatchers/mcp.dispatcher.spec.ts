import "reflect-metadata";
import {injectable} from "tsyringe";
import {AppModuleInterface} from "@pristine-ts/common";
import {Kernel} from "@pristine-ts/core";
import {IsOptional, IsString, jsonSchema, MaxLength} from "@pristine-ts/class-validator";
import {McpModule} from "../mcp.module";
import {McpDispatcher} from "./mcp.dispatcher";
import {mcpTool} from "../decorators/mcp-tool.decorator";
import {McpToolError} from "../errors/mcp-tool.error";
import {McpToolResult} from "../models/mcp-tool-result.model";
import {McpToolContextInterface} from "../interfaces/mcp-tool-context.interface";
import {McpDispatchOptionsInterface} from "../interfaces/mcp-dispatch-options.interface";

class AddNoteInput {
  @jsonSchema({description: "The title."})
  @IsString()
  @MaxLength(10)
  title: string;

  @IsOptional()
  @IsString()
  body?: string;
}

const contexts: McpToolContextInterface[] = [];

@injectable()
class NoteTools {
  @mcpTool({name: "add_note", description: "Add a note.", inputType: AddNoteInput})
  addNote(input: AddNoteInput, context: McpToolContextInterface) {
    contexts.push(context);
    return {id: "n1", title: input.title, isInstance: input instanceof AddNoteInput};
  }

  @mcpTool({name: "list_titles", description: "List the titles."})
  listTitles() {
    return ["a", "b"];
  }

  @mcpTool({name: "greet", description: "Greet."})
  greet() {
    return "hello";
  }

  @mcpTool({name: "nothing", description: "Return nothing."})
  nothing() {
  }

  @mcpTool({name: "custom", description: "Return a custom result."})
  custom() {
    return new McpToolResult([{type: "image", data: "AAAA", mimeType: "image/png"}]);
  }

  @mcpTool({name: "refuse", description: "Fail with a user error."})
  refuse() {
    throw new McpToolError("The note does not exist.");
  }

  @mcpTool({name: "crash", description: "Fail with a system error."})
  crash() {
    throw new Error("secret database detail");
  }
}

const modernMeta = {
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientCapabilities": {},
  "io.modelcontextprotocol/clientInfo": {name: "test-client", version: "1.0.0"},
};

describe("McpDispatcher", () => {
  let kernel: Kernel;
  let dispatcher: McpDispatcher;
  let options: McpDispatchOptionsInterface;

  beforeAll(async () => {
    kernel = new Kernel();
    await kernel.start({keyname: "mcp.test", importModules: [McpModule], providerRegistrations: []} as AppModuleInterface, {
      "pristine.mcp.server.name": "test-server",
      "pristine.mcp.server.version": "2.0.0",
      "pristine.mcp.server.instructions": "Use add_note to save notes.",
      "pristine.logging.consoleLoggerActivated": false,
    });
    dispatcher = kernel.container.resolve(McpDispatcher);
    options = {container: kernel.container};
  });

  beforeEach(() => {
    contexts.length = 0;
  });

  describe("message validation", () => {
    it("should refuse what is not a JSON-RPC request with a 400 and no id", async () => {
      for (const message of [null, "x", [], {jsonrpc: "1.0", id: 1, method: "ping"}, {jsonrpc: "2.0", id: 1}, {jsonrpc: "2.0", id: {}, method: "ping"}, {jsonrpc: "2.0", id: 1, method: "ping", params: [] as unknown[]}] as unknown[]) {
        const result = await dispatcher.dispatch(message, options);

        expect(result.httpStatus).toBe(400);
        expect(result.response).toEqual({jsonrpc: "2.0", error: {code: -32600, message: expect.any(String)}});
      }
    });

    it("should accept a notification with a 202 and no response", async () => {
      expect(await dispatcher.dispatch({jsonrpc: "2.0", method: "notifications/initialized"}, options)).toEqual({httpStatus: 202});
      expect(await dispatcher.dispatch({jsonrpc: "2.0", method: "notifications/unknown"}, options)).toEqual({httpStatus: 202});
    });
  });

  describe("modern requests (2026-07-28)", () => {
    it("should answer server/discover with the versions, capabilities and server info", async () => {
      const result = await dispatcher.dispatch({jsonrpc: "2.0", id: "d1", method: "server/discover", params: {_meta: modernMeta}}, options);

      expect(result).toEqual({
        httpStatus: 200,
        response: {
          jsonrpc: "2.0",
          id: "d1",
          result: {
            resultType: "complete",
            supportedVersions: ["2026-07-28", "2025-11-25", "2025-06-18", "2025-03-26"],
            capabilities: {tools: {}},
            instructions: "Use add_note to save notes.",
            _meta: {"io.modelcontextprotocol/serverInfo": {name: "test-server", version: "2.0.0"}},
          },
        },
      });
    });

    it("should list the tools", async () => {
      const result = await dispatcher.dispatch({jsonrpc: "2.0", id: 1, method: "tools/list", params: {_meta: modernMeta}}, options);
      const tools = result.response!.result!.tools as any[];

      expect(result.response!.result!.resultType).toBe("complete");
      expect(tools.map(tool => tool.name)).toEqual(["add_note", "list_titles", "greet", "nothing", "custom", "refuse", "crash"]);
      expect(tools[0].inputSchema.properties.title).toEqual({type: "string", maxLength: 10, description: "The title."});
    });

    it("should call a tool with a mapped, validated input and a context", async () => {
      const result = await dispatcher.dispatch({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {name: "add_note", arguments: {title: "Milk"}, _meta: modernMeta},
      }, {...options, identity: {id: "user-1", claims: {}}});

      expect(result.response!.result).toEqual({
        resultType: "complete",
        content: [{type: "text", text: JSON.stringify({id: "n1", title: "Milk", isInstance: true})}],
        structuredContent: {id: "n1", title: "Milk", isInstance: true},
        isError: false,
        _meta: {"io.modelcontextprotocol/serverInfo": {name: "test-server", version: "2.0.0"}},
      });
      expect(contexts[0].identity).toEqual({id: "user-1", claims: {}});
      expect(contexts[0].protocolVersion).toBe("2026-07-28");
      expect(contexts[0].clientInfo).toEqual({name: "test-client", version: "1.0.0"});
      expect(contexts[0].signal.aborted).toBe(false);
    });

    it("should report invalid arguments as a tool execution error", async () => {
      const result = await dispatcher.dispatch({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {name: "add_note", arguments: {title: "A title that is far too long"}, _meta: modernMeta},
      }, options);

      expect(result.httpStatus).toBe(200);
      expect(result.response!.result!.isError).toBe(true);
      expect((result.response!.result!.content as any[])[0].text).toContain("- title:");
      expect(contexts).toHaveLength(0);
    });

    it("should normalize strings, arrays, nothing and custom results", async () => {
      const call = async (name: string) => (await dispatcher.dispatch({jsonrpc: "2.0", id: name, method: "tools/call", params: {name, _meta: modernMeta}}, options)).response!.result!;

      expect((await call("greet")).content).toEqual([{type: "text", text: "hello"}]);
      expect((await call("list_titles")).structuredContent).toEqual(["a", "b"]);
      expect((await call("nothing")).content).toEqual([]);
      expect((await call("custom")).content).toEqual([{type: "image", data: "AAAA", mimeType: "image/png"}]);
    });

    it("should surface a user error and hide a system error", async () => {
      const call = async (name: string) => (await dispatcher.dispatch({jsonrpc: "2.0", id: name, method: "tools/call", params: {name, _meta: modernMeta}}, options)).response!.result!;

      expect(await call("refuse")).toEqual(expect.objectContaining({isError: true, content: [{type: "text", text: "The note does not exist."}]}));
      expect(await call("crash")).toEqual(expect.objectContaining({isError: true, content: [{type: "text", text: "The tool 'crash' failed."}]}));
    });

    it("should refuse an unknown tool or malformed call params with -32602", async () => {
      for (const params of [{name: "unknown"}, {}, {name: "greet", arguments: []}]) {
        const result = await dispatcher.dispatch({jsonrpc: "2.0", id: 4, method: "tools/call", params: {...params, _meta: modernMeta}}, options);

        expect(result.httpStatus).toBe(400);
        expect(result.response!.error!.code).toBe(-32602);
      }
    });

    it("should refuse an unsupported version with -32022 and the supported list", async () => {
      const result = await dispatcher.dispatch({
        jsonrpc: "2.0",
        id: 5,
        method: "tools/list",
        params: {_meta: {...modernMeta, "io.modelcontextprotocol/protocolVersion": "1900-01-01"}},
      }, options);

      expect(result).toEqual({
        httpStatus: 400,
        response: {
          jsonrpc: "2.0",
          id: 5,
          error: {
            code: -32022,
            message: "Unsupported protocol version",
            data: {supported: ["2026-07-28", "2025-11-25", "2025-06-18", "2025-03-26"], requested: "1900-01-01"},
          },
        },
      });
    });

    it("should refuse a request without client capabilities with -32602", async () => {
      const result = await dispatcher.dispatch({
        jsonrpc: "2.0",
        id: 6,
        method: "tools/list",
        params: {_meta: {"io.modelcontextprotocol/protocolVersion": "2026-07-28"}},
      }, options);

      expect(result.httpStatus).toBe(400);
      expect(result.response!.error!.code).toBe(-32602);
    });

    it("should answer an unknown method with -32601 and a 404", async () => {
      const result = await dispatcher.dispatch({jsonrpc: "2.0", id: 7, method: "resources/list", params: {_meta: modernMeta}}, options);

      expect(result.httpStatus).toBe(404);
      expect(result.response!.error!.code).toBe(-32601);
    });
  });

  describe("legacy requests (2025-11-25 and earlier)", () => {
    it("should agree on the requested legacy version in initialize", async () => {
      const result = await dispatcher.dispatch({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {protocolVersion: "2025-06-18", capabilities: {}, clientInfo: {name: "old", version: "1"}},
      }, options);

      expect(result.response!.result).toEqual({
        protocolVersion: "2025-06-18",
        capabilities: {tools: {listChanged: false}},
        serverInfo: {name: "test-server", version: "2.0.0"},
        instructions: "Use add_note to save notes.",
      });
    });

    it("should offer the newest legacy version for an unknown one, and refuse a missing one", async () => {
      const unknown = await dispatcher.dispatch({jsonrpc: "2.0", id: 1, method: "initialize", params: {protocolVersion: "2024-11-05"}}, options);
      const missing = await dispatcher.dispatch({jsonrpc: "2.0", id: 2, method: "initialize", params: {}}, options);

      expect(unknown.response!.result!.protocolVersion).toBe("2025-11-25");
      expect(missing.httpStatus).toBe(200);
      expect(missing.response!.error!.code).toBe(-32602);
    });

    it("should serve requests without _meta statelessly and without resultType", async () => {
      const list = await dispatcher.dispatch({jsonrpc: "2.0", id: 1, method: "tools/list"}, options);
      const ping = await dispatcher.dispatch({jsonrpc: "2.0", id: 2, method: "ping"}, options);

      expect(list.response!.result!.resultType).toBeUndefined();
      expect((list.response!.result!.tools as any[]).length).toBe(7);
      expect(ping.response!.result).toEqual({});
    });

    it("should keep structured content only where the legacy version allows it", async () => {
      const call = async (name: string, legacyProtocolVersion?: string) =>
        (await dispatcher.dispatch({jsonrpc: "2.0", id: 1, method: "tools/call", params: {name, arguments: {title: "Milk"}}}, {...options, legacyProtocolVersion})).response!.result!;

      expect((await call("add_note", "2025-11-25")).structuredContent).toEqual({id: "n1", title: "Milk", isInstance: true});
      expect((await call("list_titles", "2025-11-25")).structuredContent).toBeUndefined();
      expect((await call("add_note", "2025-03-26")).structuredContent).toBeUndefined();
      expect((await call("add_note")).structuredContent).toBeUndefined();
      expect(contexts.map(context => context.protocolVersion)).toEqual(["2025-11-25", "2025-03-26", "2025-03-26"]);
    });

    it("should serve a request whose _meta names a legacy version with legacy semantics", async () => {
      const result = await dispatcher.dispatch({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {_meta: {"io.modelcontextprotocol/protocolVersion": "2025-11-25"}},
      }, options);

      expect(result.httpStatus).toBe(200);
      expect(result.response!.result!.resultType).toBeUndefined();
    });

    it("should answer an unknown method with -32601 in a 200", async () => {
      const result = await dispatcher.dispatch({jsonrpc: "2.0", id: 1, method: "prompts/list"}, options);

      expect(result.httpStatus).toBe(200);
      expect(result.response!.error!.code).toBe(-32601);
    });
  });
});
