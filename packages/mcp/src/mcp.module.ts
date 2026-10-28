import {CommonModule, ModuleInterface} from "@pristine-ts/common";
import {JsonSchemaGenerator} from "@pristine-ts/class-validator";
import {McpModuleKeyname} from "./mcp.module.keyname";

export * from "./decorators/decorators";
export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./managers/managers";

export * from "./mcp.module.keyname";

/**
 * The MCP module. Import it into your application module, then expose methods of your
 * `@injectable()` services with `@mcpTool`.
 *
 * The package implements the Model Context Protocol itself and adds no third-party dependency:
 * the tool input schemas come from the `@pristine-ts/class-validator` decorators you already use
 * for validation, through its `JsonSchemaGenerator`.
 */
export const McpModule: ModuleInterface = {
  keyname: McpModuleKeyname,
  importModules: [
    CommonModule,
  ],
  providerRegistrations: [
    {
      token: JsonSchemaGenerator,
      useValue: new JsonSchemaGenerator(),
    },
  ],
  configurationDefinitions: [],
};
