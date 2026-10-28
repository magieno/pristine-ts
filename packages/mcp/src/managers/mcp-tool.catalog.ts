import {injectable} from "tsyringe";
import {moduleScoped} from "@pristine-ts/common";
import {McpModuleKeyname} from "../mcp.module.keyname";
import {mcpToolRegistry} from "../decorators/mcp-tool.decorator";
import {JsonSchemaGenerator, JsonSchemaInterface} from "@pristine-ts/class-validator";
import {McpToolDefinitionInterface} from "../interfaces/mcp-tool-definition.interface";
import {McpToolRegistrationInterface} from "../interfaces/mcp-tool-registration.interface";
import {McpToolDeclarationError} from "../errors/mcp-tool-declaration.error";

/**
 * The tools of this server, built from every `@mcpTool` method.
 *
 * The catalog is built on first use and validated as a whole: a bad name, a duplicated name or an
 * input class that cannot become a JSON Schema throws a `McpToolDeclarationError`.
 */
@moduleScoped(McpModuleKeyname)
@injectable()
export class McpToolCatalog {
  /**
   * The tool names the specification recommends: 1 to 128 ASCII letters, digits, `_`, `-` or `.`.
   */
  private static readonly NamePattern = /^[A-Za-z0-9_.-]{1,128}$/;

  private entries?: Map<string, { registration: McpToolRegistrationInterface, definition: McpToolDefinitionInterface }>;

  public constructor(private readonly schemaGenerator: JsonSchemaGenerator) {
  }

  /**
   * Returns the definition of every tool, in declaration order.
   */
  public list(): McpToolDefinitionInterface[] {
    return [...this.build().values()].map(entry => entry.definition);
  }

  /**
   * Returns the registration of a tool, or `undefined` when no tool has this name.
   *
   * @param name The name of the tool.
   */
  public find(name: string): McpToolRegistrationInterface | undefined {
    return this.build().get(name)?.registration;
  }

  private build(): Map<string, { registration: McpToolRegistrationInterface, definition: McpToolDefinitionInterface }> {
    if (this.entries !== undefined) {
      return this.entries;
    }

    const entries = new Map<string, { registration: McpToolRegistrationInterface, definition: McpToolDefinitionInterface }>();

    for (const registration of mcpToolRegistry) {
      const options = registration.options;
      const owner = `${registration.classConstructor.name}.${registration.methodKeyname}`;

      if (McpToolCatalog.NamePattern.test(options.name) === false) {
        throw new McpToolDeclarationError(`The tool name '${options.name}' on '${owner}' is invalid. Use 1 to 128 ASCII letters, digits, '_', '-' or '.'.`, {
          name: options.name,
          owner,
        });
      }

      if (entries.has(options.name)) {
        const other = entries.get(options.name)!.registration;
        throw new McpToolDeclarationError(`The tool name '${options.name}' is declared twice: on '${other.classConstructor.name}.${other.methodKeyname}' and on '${owner}'.`, {
          name: options.name,
        });
      }

      const definition: McpToolDefinitionInterface = {
        name: options.name,
        description: options.description,
        inputSchema: this.inputSchema(registration),
      };

      if (options.title !== undefined) {
        definition.title = options.title;
      }
      if (options.annotations !== undefined) {
        definition.annotations = options.annotations;
      }

      entries.set(options.name, {registration, definition});
    }

    this.entries = entries;

    return entries;
  }

  private inputSchema(registration: McpToolRegistrationInterface): JsonSchemaInterface {
    const inputType = registration.options.inputType;

    if (inputType === undefined) {
      return {type: "object", additionalProperties: false};
    }

    try {
      return this.schemaGenerator.generate(inputType);
    } catch (error) {
      throw new McpToolDeclarationError(`The input of the tool '${registration.options.name}' cannot become a JSON Schema: ${(error as Error).message}`, {
        name: registration.options.name,
        inputType: inputType.name,
      }, error as Error);
    }
  }
}
