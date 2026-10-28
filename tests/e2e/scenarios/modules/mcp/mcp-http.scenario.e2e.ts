import "reflect-metadata";
import {injectable} from "tsyringe";
import {AppModuleInterface, HttpMethod, IdentityInterface, Request, Response} from "@pristine-ts/common";
import {CoreModule, ExecutionContextKeynameEnum, Kernel} from "@pristine-ts/core";
import {controller, identity, NetworkingModule, request, route} from "@pristine-ts/networking";
import {IsString, jsonSchema, MaxLength} from "@pristine-ts/class-validator";
import {McpHttpTransport, McpModule, mcpTool} from "@pristine-ts/mcp";

class CreateTodoInput {
    @jsonSchema({description: "The title of the to-do."})
    @IsString()
    @MaxLength(50)
    title: string;
}

const created: string[] = [];

@injectable()
class TodoTools {
    @mcpTool({name: "create_todo", description: "Create a to-do.", inputType: CreateTodoInput})
    async createTodo(input: CreateTodoInput) {
        created.push(input.title);
        return {id: `todo-${created.length}`, title: input.title};
    }
}

@controller("/mcp")
@injectable()
class McpController {
    constructor(private readonly mcpHttpTransport: McpHttpTransport) {
    }

    @route(HttpMethod.Post, "")
    post(@request() incoming: Request, @identity() caller?: IdentityInterface) {
        return this.mcpHttpTransport.handle(incoming, caller);
    }

    @route(HttpMethod.Get, "")
    get(@request() incoming: Request) {
        return this.mcpHttpTransport.handle(incoming);
    }
}

const meta = {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {},
};

describe("MCP - Streamable HTTP through a controller", () => {
    let kernel: Kernel;

    const send = async (httpMethod: HttpMethod, body: unknown, headers: { [key: string]: string } = {}): Promise<Response> => {
        const mcpRequest = new Request(httpMethod, "http://127.0.0.1:6635/mcp", "uuid");
        mcpRequest.body = body;
        mcpRequest.setHeaders({"Content-Type": "application/json", ...headers});

        return await kernel.handle(mcpRequest, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;
    };

    beforeAll(async () => {
        const appModule: AppModuleInterface = {
            keyname: "mcp.e2e",
            importModules: [CoreModule, NetworkingModule, McpModule],
            importServices: [],
        };

        kernel = new Kernel();
        await kernel.start(appModule, {
            "pristine.logging.consoleLoggerActivated": false,
            "pristine.mcp.server.name": "e2e-server",
        });
    });

    it("should list the tools and call one, end to end", async () => {
        const list = await send(HttpMethod.Post, {jsonrpc: "2.0", id: 1, method: "tools/list", params: {_meta: meta}}, {
            "MCP-Protocol-Version": "2026-07-28",
            "Mcp-Method": "tools/list",
        });

        expect(list.status).toBe(200);
        expect(list.body.result.tools[0]).toEqual(expect.objectContaining({
            name: "create_todo",
            inputSchema: {
                type: "object",
                properties: {title: {type: "string", maxLength: 50, description: "The title of the to-do."}},
                required: ["title"],
                additionalProperties: false,
            },
        }));
        expect(list.body.result._meta["io.modelcontextprotocol/serverInfo"].name).toBe("e2e-server");

        const call = await send(HttpMethod.Post, {jsonrpc: "2.0", id: 2, method: "tools/call", params: {name: "create_todo", arguments: {title: "Buy milk"}, _meta: meta}}, {
            "MCP-Protocol-Version": "2026-07-28",
            "Mcp-Method": "tools/call",
            "Mcp-Name": "create_todo",
        });

        expect(call.status).toBe(200);
        expect(call.body.result.structuredContent).toEqual({id: "todo-1", title: "Buy milk"});
        expect(created).toEqual(["Buy milk"]);
    });

    it("should complete the legacy handshake statelessly", async () => {
        const initialize = await send(HttpMethod.Post, {jsonrpc: "2.0", id: 1, method: "initialize", params: {protocolVersion: "2025-06-18", capabilities: {}}});
        const initialized = await send(HttpMethod.Post, {jsonrpc: "2.0", method: "notifications/initialized"}, {"MCP-Protocol-Version": "2025-06-18"});
        const list = await send(HttpMethod.Post, {jsonrpc: "2.0", id: 2, method: "tools/list"}, {"MCP-Protocol-Version": "2025-06-18"});

        expect(initialize.body.result.protocolVersion).toBe("2025-06-18");
        expect(initialize.getHeader("Mcp-Session-Id")).toBeUndefined();
        expect(initialized.status).toBe(202);
        expect(list.body.result.tools.map((tool: any) => tool.name)).toEqual(["create_todo"]);
    });

    it("should answer GET with a 405 and refuse a foreign origin with a 403", async () => {
        expect((await send(HttpMethod.Get, undefined)).status).toBe(405);
        expect((await send(HttpMethod.Post, {jsonrpc: "2.0", id: 1, method: "ping"}, {Origin: "https://evil.example.com"})).status).toBe(403);
    });
});
