# MCP Module

Expose methods of your Pristine services as [Model Context Protocol](https://modelcontextprotocol.io)
tools. The module implements the protocol itself — **no third-party MCP SDK, no new dependency**.

## Declare a tool

The input class is a normal `@pristine-ts/class-validator` class. Its decorators become the tool's
JSON Schema (`inputSchema`) and validate every call, so there is one source of truth.

```typescript
import {injectable} from "tsyringe";
import {IsOptional, IsString, MaxLength} from "@pristine-ts/class-validator";
import {mcpTool, mcpToolParameter} from "@pristine-ts/mcp";

export class CreateTodoInput {
  @mcpToolParameter({description: "The title of the to-do."})
  @IsString()
  @MaxLength(200)
  title: string;

  @mcpToolParameter({description: "Free-form notes."})
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

- A property is listed when at least one decorator marks it.
- It is **required** unless it carries `@IsOptional()` or `@ValidateIf()`.
- The type comes from the type validators (`@IsString`, `@IsInt`, `@IsEnum`, `@IsIn`, ...), then
  from the TypeScript design type. A nested class becomes a nested object schema; `@array(Type)`
  gives the item schema of an array.
- Constraints with a JSON Schema equivalent are translated (`@MaxLength` → `maxLength`, `@Min` →
  `minimum`, `@IsEmail` → `format: email`, ...). The others are still enforced on every call.
- `@mcpToolParameter({schema: {...}})` merges keywords last, for anything validation cannot say.
- Objects are closed (`additionalProperties: false`). A recursive input class is refused.
