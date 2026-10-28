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
