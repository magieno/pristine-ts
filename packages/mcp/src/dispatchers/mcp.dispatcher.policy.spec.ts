import "reflect-metadata";
import {injectable} from "tsyringe";
import {AppModuleInterface, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {Kernel} from "@pristine-ts/core";
import {McpModule} from "../mcp.module";
import {McpDispatcher} from "./mcp.dispatcher";
import {mcpTool} from "../decorators/mcp-tool.decorator";
import {McpDispatchOptionsInterface} from "../interfaces/mcp-dispatch-options.interface";
import {McpToolDefinitionInterface} from "../interfaces/mcp-tool-definition.interface";
import {McpToolPolicyInterface} from "../interfaces/mcp-tool-policy.interface";
import {McpToolPolicyContextInterface} from "../interfaces/mcp-tool-policy-context.interface";

const calls: string[] = [];
const hidden = new Set<string>();
const contexts: McpToolPolicyContextInterface[] = [];

@injectable()
class Tools {
  @mcpTool({name: "add_todo", description: "Add a to-do."})
  addTodo() {
    calls.push("add_todo");
    return "added";
  }

  @mcpTool({name: "add_note", description: "Add a note."})
  addNote() {
    calls.push("add_note");
    return "added";
  }
}

@tag(ServiceDefinitionTagEnum.McpToolPolicy)
@injectable()
class HiddenToolsPolicy implements McpToolPolicyInterface {
  isToolAllowed(tool: McpToolDefinitionInterface, context: McpToolPolicyContextInterface): boolean {
    contexts.push(context);
    return hidden.has(tool.name) === false;
  }
}

@tag(ServiceDefinitionTagEnum.McpToolPolicy)
@injectable()
class AsyncPolicy implements McpToolPolicyInterface {
  async isToolAllowed(): Promise<boolean> {
    return true;
  }
}

describe("McpDispatcher with tool policies", () => {
  let dispatcher: McpDispatcher;
  let options: McpDispatchOptionsInterface;

  beforeAll(async () => {
    const kernel = new Kernel();
    await kernel.start({keyname: "mcp.policy.test", importModules: [McpModule], providerRegistrations: []} as AppModuleInterface, {
      "pristine.logging.consoleLoggerActivated": false,
    });
    dispatcher = kernel.container.resolve(McpDispatcher);
    options = {container: kernel.container, identity: {id: "user-1", claims: {}}};
  });

  beforeEach(() => {
    calls.length = 0;
    contexts.length = 0;
    hidden.clear();
  });

  it("should list every tool when every policy allows it", async () => {
    const result = await dispatcher.dispatch({jsonrpc: "2.0", id: 1, method: "tools/list"}, options);

    expect((result.response!.result as any).tools.map((tool: any) => tool.name)).toEqual(["add_todo", "add_note"]);
    expect(contexts[0].identity?.id).toBe("user-1");
  });

  it("should not list a tool that a policy refuses", async () => {
    hidden.add("add_note");

    const result = await dispatcher.dispatch({jsonrpc: "2.0", id: 1, method: "tools/list"}, options);

    expect((result.response!.result as any).tools.map((tool: any) => tool.name)).toEqual(["add_todo"]);
  });

  it("should answer a call to a refused tool as an unknown tool, and not run it", async () => {
    hidden.add("add_note");

    const result = await dispatcher.dispatch({jsonrpc: "2.0", id: 2, method: "tools/call", params: {name: "add_note"}}, options);

    expect(result.response!.error).toEqual({code: -32602, message: "Unknown tool: 'add_note'."});
    expect(calls).toEqual([]);
  });

  it("should run an allowed tool and give the policy the client the request names", async () => {
    const result = await dispatcher.dispatch({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "add_todo",
        _meta: {
          "io.modelcontextprotocol/protocolVersion": "2026-07-28",
          "io.modelcontextprotocol/clientCapabilities": {},
          "io.modelcontextprotocol/clientInfo": {name: "claude-code", version: "2.0.0"},
        },
      },
    }, options);

    expect((result.response!.result as any).content).toEqual([{type: "text", text: "added"}]);
    expect(calls).toEqual(["add_todo"]);
    expect(contexts[0].clientInfo).toEqual({name: "claude-code", version: "2.0.0"});
  });
});
