# MCP Module

Expose methods of your Pristine services as [Model Context Protocol](https://modelcontextprotocol.io)
tools. The module implements the protocol itself — **no third-party MCP SDK, no new dependency**.

## Declare a tool

The input class is a normal `@pristine-ts/class-validator` class. Its decorators become the tool's
JSON Schema (`inputSchema`, through the package's `JsonSchemaGenerator`) and validate every call,
so there is one source of truth. `@jsonSchema({description})` documents a property for the model.

```typescript
import {injectable} from "tsyringe";
import {IsOptional, IsString, jsonSchema, MaxLength} from "@pristine-ts/class-validator";
import {mcpTool} from "@pristine-ts/mcp";

export class CreateTodoInput {
  @jsonSchema({description: "The title of the to-do."})
  @IsString()
  @MaxLength(200)
  title: string;

  @jsonSchema({description: "Free-form notes."})
  @IsOptional()
  @IsString()
  notes?: string;
}

@injectable()
export class TodoTools {
  @mcpTool({
    name: "create_todo",
    description: "Create a to-do in the user's list.",
    inputType: CreateTodoInput,
  })
  async createTodo(input: CreateTodoInput) {
    // ...
  }
}
```

## Schema rules

The schema rules (required properties, type resolution, translated constraints, `@jsonSchema`)
belong to `JsonSchemaGenerator` in `@pristine-ts/class-validator`; see its readme. A tool whose
input cannot become a JSON Schema (a class that contains itself) makes the catalog throw a
`McpToolDeclarationError` when it is first built.

## Tool methods

A tool method receives the validated input (an instance of `inputType`) and an
`McpToolContextInterface`: the caller's `identity`, an `AbortSignal`, the `protocolVersion` and the
self-reported `clientInfo`.

| The method returns | The client gets |
| --- | --- |
| a `string` | one text block |
| any other JSON value | `structuredContent` plus the same value as JSON text |
| `undefined` / `null` | no content |
| an `McpToolResult` | exactly that (images, several blocks, ...) |

| The call | The client gets |
| --- | --- |
| fails validation | a tool execution error listing each invalid property |
| throws `McpToolError` or any `PristineError` of kind `UserError` | a tool execution error with its message |
| throws anything else | a generic tool execution error; the error is logged, never sent |

## Choose which tools a caller gets

A tool policy hides tools, for example from a setting the user controls. Tag a class with
`ServiceDefinitionTagEnum.McpToolPolicy` and implement `McpToolPolicyInterface`:

```ts
@tag(ServiceDefinitionTagEnum.McpToolPolicy)
@injectable()
export class SettingsToolPolicy implements McpToolPolicyInterface {
  constructor(private readonly settings: SettingsService) {}

  isToolAllowed(tool: McpToolDefinitionInterface, context: McpToolPolicyContextInterface): boolean {
    return this.settings.disabledTools.includes(tool.name) === false;
  }
}
```

A tool is served only when every policy allows it. A refused tool is not in `tools/list`, and
`tools/call` answers it as an unknown tool. The policy gets the caller's `identity` and the
self-reported `clientInfo`; never base a security decision on `clientInfo`.

## Serve it

### Streamable HTTP

Pristine owns the HTTP server and the routing, so you serve the endpoint from your own controller.
Authentication, authorization and interceptors keep working as for any route.

```typescript
import {inject, injectable} from "tsyringe";
import {HttpMethod, IdentityInterface, Request} from "@pristine-ts/common";
import {controller, identity, request, route} from "@pristine-ts/networking";
import {McpHttpTransport} from "@pristine-ts/mcp";

@controller("/mcp")
@injectable()
export class McpController {
  constructor(private readonly mcpHttpTransport: McpHttpTransport) {
  }

  @route(HttpMethod.Post, "")
  post(@request() request: Request, @identity() identity?: IdentityInterface) {
    return this.mcpHttpTransport.handle(request, identity);
  }

  // Older clients probe with GET; the transport answers 405 (no server stream, no session).
  @route(HttpMethod.Get, "")
  get(@request() request: Request) {
    return this.mcpHttpTransport.handle(request);
  }
}
```

- A request with an `Origin` header that is not in `pristine.mcp.http.allowedOrigins` gets a 403.
  This blocks DNS-rebinding attacks on a server bound to `127.0.0.1`.
- Responses are always one JSON object. There is no SSE stream, no session id and no resumption.

### stdio

The client starts your CLI as a subprocess. Serve stdin/stdout from a command:

```typescript
@tag(ServiceDefinitionTagEnum.Command)
@injectable()
export class McpServeCommand implements CommandInterface<McpServeCommandOptions> {
  constructor(private readonly mcpStdioTransport: McpStdioTransport) {
  }

  async run(): Promise<ExitCode> {
    await this.mcpStdioTransport.listen();
    return ExitCode.Success;
  }
}
```

Only MCP messages may reach stdout. Send the logs to stderr
(`pristine.logging.consoleLogger*Stream`) or turn the console logger off.

## Protocol support

- **Modern, 2026-07-28**: stateless; the version and the client capabilities come from `_meta` on
  every request; `server/discover`; the HTTP `MCP-Protocol-Version`, `Mcp-Method` and `Mcp-Name`
  headers must match the body.
- **Legacy, 2025-11-25 / 2025-06-18 / 2025-03-26**: `initialize` is answered, but no session is
  kept. Every legacy request is served the same way.
- **Tools only.** `ping`, `tools/list` and `tools/call`. Resources, prompts, sampling, elicitation,
  subscriptions and progress notifications are not implemented.
- **No OAuth resource-server metadata yet.** Authenticate the HTTP route with a Pristine
  authenticator, or keep the server on loopback.

## Configuration

| Key | Default | Purpose |
| --- | --- | --- |
| `pristine.mcp.server.name` | `pristine-mcp-server` | `serverInfo.name` |
| `pristine.mcp.server.version` | `1.0.0` | `serverInfo.version` |
| `pristine.mcp.server.instructions` | `""` | Guidance for the model; empty means none |
| `pristine.mcp.http.allowedOrigins` | `""` | Browser origins allowed on the HTTP endpoint (comma-separated or `string[]`) |
