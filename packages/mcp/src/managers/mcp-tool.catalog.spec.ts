import "reflect-metadata";
import {IsOptional, IsString, JsonSchemaGenerator, ValidateNested} from "@pristine-ts/class-validator";
import {McpToolCatalog} from "./mcp-tool.catalog";
import {mcpTool, mcpToolRegistry} from "../decorators/mcp-tool.decorator";
import {McpToolDeclarationError} from "../errors/mcp-tool-declaration.error";

class EchoInput {
  @IsString()
  text: string;
}

class RecursiveInput {
  @IsOptional()
  @ValidateNested()
  child?: RecursiveInput;
}

class EchoTools {
  @mcpTool({
    name: "echo",
    title: "Echo",
    description: "Returns the text.",
    inputType: EchoInput,
    annotations: {readOnlyHint: true},
  })
  echo(input: EchoInput) {
    return input.text;
  }

  @mcpTool({name: "now", description: "Returns the current time."})
  now() {
    return new Date().toISOString();
  }
}

describe("McpToolCatalog", () => {
  const declared = [...mcpToolRegistry];

  afterEach(() => {
    mcpToolRegistry.splice(0, mcpToolRegistry.length, ...declared);
  });

  it("should list every declared tool in declaration order", () => {
    const catalog = new McpToolCatalog(new JsonSchemaGenerator());

    expect(catalog.list()).toEqual([
      {
        name: "echo",
        title: "Echo",
        description: "Returns the text.",
        inputSchema: {
          type: "object",
          properties: {text: {type: "string"}},
          required: ["text"],
          additionalProperties: false,
        },
        annotations: {readOnlyHint: true},
      },
      {
        name: "now",
        description: "Returns the current time.",
        inputSchema: {type: "object", additionalProperties: false},
      },
    ]);
  });

  it("should find the registration of a tool by name", () => {
    const catalog = new McpToolCatalog(new JsonSchemaGenerator());

    expect(catalog.find("echo")).toEqual({
      classConstructor: EchoTools,
      methodKeyname: "echo",
      options: expect.objectContaining({name: "echo"}),
    });
    expect(catalog.find("unknown")).toBeUndefined();
  });

  it("should refuse an invalid tool name", () => {
    mcpToolRegistry.push({classConstructor: EchoTools, methodKeyname: "echo", options: {name: "has space", description: ""}});

    expect(() => new McpToolCatalog(new JsonSchemaGenerator()).list()).toThrow(McpToolDeclarationError);
  });

  it("should refuse an input class that cannot become a JSON Schema", () => {
    mcpToolRegistry.push({classConstructor: EchoTools, methodKeyname: "now", options: {name: "recursive", description: "", inputType: RecursiveInput}});

    expect(() => new McpToolCatalog(new JsonSchemaGenerator()).list()).toThrow(McpToolDeclarationError);
  });

  it("should refuse a duplicated tool name", () => {
    mcpToolRegistry.push({classConstructor: EchoTools, methodKeyname: "now", options: {name: "echo", description: ""}});

    expect(() => new McpToolCatalog(new JsonSchemaGenerator()).list()).toThrow("declared twice");
  });
});
