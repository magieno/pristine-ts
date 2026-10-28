import {CommonModule, ModuleInterface} from "@pristine-ts/common";
import {McpModuleKeyname} from "./mcp.module.keyname";

export * from "./decorators/decorators";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./schemas/schemas";

export * from "./mcp.module.keyname";

/**
 * The MCP module. Import it into your application module, then expose methods of your
 * `@injectable()` services with `@mcpTool`.
 *
 * The package implements the Model Context Protocol itself and adds no third-party dependency:
 * the tool input schemas come from the `@pristine-ts/class-validator` decorators you already use
 * for validation.
 */
export const McpModule: ModuleInterface = {
  keyname: McpModuleKeyname,
  importModules: [
    CommonModule,
  ],
  providerRegistrations: [],
  configurationDefinitions: [],
};
