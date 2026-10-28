import {DependencyContainer, inject, injectable} from "tsyringe";
import {moduleScoped, PristineError, PristineErrorKind} from "@pristine-ts/common";
import {Validator, ValidationError} from "@pristine-ts/class-validator";
import {DataMapper} from "@pristine-ts/data-mapping-common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {McpModuleKeyname} from "../mcp.module.keyname";
import {McpToolRegistrationInterface} from "../interfaces/mcp-tool-registration.interface";
import {McpToolContextInterface} from "../interfaces/mcp-tool-context.interface";
import {McpToolResult} from "../models/mcp-tool-result.model";

/**
 * Calls one tool: maps the arguments onto the input class, validates them, calls the method and
 * turns what it returns or throws into a `McpToolResult`.
 *
 * Invalid arguments and user errors become tool execution errors (`isError: true`), which the
 * specification asks for so the model can correct itself. They never become protocol errors.
 */
@moduleScoped(McpModuleKeyname)
@injectable()
export class McpToolInvoker {
  public constructor(private readonly dataMapper: DataMapper,
                     private readonly validator: Validator,
                     @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
  }

  /**
   * @param registration The tool to call.
   * @param args The `arguments` of the `tools/call` request.
   * @param context The context passed to the tool.
   * @param container The container the tool class is resolved from.
   */
  public async invoke(registration: McpToolRegistrationInterface,
                      args: { [key: string]: unknown },
                      context: McpToolContextInterface,
                      container: DependencyContainer): Promise<McpToolResult> {
    const toolName = registration.options.name;
    let input: unknown = args;

    if (registration.options.inputType !== undefined) {
      try {
        input = await this.dataMapper.autoMap(args, registration.options.inputType);
      } catch (error) {
        return McpToolResult.error(`The arguments of '${toolName}' are invalid: ${(error as Error).message}`);
      }

      const errors = await this.validator.validate(input);

      if (errors.length > 0) {
        return McpToolResult.error(`The arguments of '${toolName}' are invalid:\n` + this.formatValidationErrors(errors, "").join("\n"));
      }
    }

    // ── container.resolve, justified ──────────────────────────────────────────────
    // Dynamic dispatch, like the router resolving a controller: the class to call is data
    // carried by the tool registration, chosen by the `name` of the request.
    const instance: any = container.resolve(registration.classConstructor as any);

    let returned: unknown;

    try {
      returned = await instance[registration.methodKeyname](input, context);
    } catch (error) {
      return this.errorResult(toolName, error);
    }

    return this.normalize(returned);
  }

  private normalize(returned: unknown): McpToolResult {
    if (returned instanceof McpToolResult) {
      return returned;
    }

    if (returned === undefined || returned === null) {
      return new McpToolResult([]);
    }

    if (typeof returned === "string") {
      return McpToolResult.text(returned);
    }

    return McpToolResult.json(returned);
  }

  private errorResult(toolName: string, error: unknown): McpToolResult {
    if (error instanceof PristineError && error.options.kind === PristineErrorKind.UserError) {
      return McpToolResult.error(error.message);
    }

    this.logHandler.error(`The MCP tool '${toolName}' threw an error.`, {
      highlights: {
        toolName,
      },
      extra: {
        error,
      },
    });

    return McpToolResult.error(`The tool '${toolName}' failed.`);
  }

  private formatValidationErrors(errors: ValidationError[], parentPath: string): string[] {
    const lines: string[] = [];

    for (const error of errors) {
      const path = parentPath === "" ? error.property : `${parentPath}.${error.property}`;

      for (const constraint of Object.values(error.constraints ?? {})) {
        lines.push(`- ${path}: ${constraint.message}`);
      }

      lines.push(...this.formatValidationErrors(error.children ?? [], path));
    }

    return lines;
  }
}
