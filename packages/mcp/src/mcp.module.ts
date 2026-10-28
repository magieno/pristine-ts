import {CommonModule, ModuleInterface} from "@pristine-ts/common";
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {DataMappingModule} from "@pristine-ts/data-mapping";
import {LoggingModule} from "@pristine-ts/logging";
import {JsonSchemaGenerator, Validator} from "@pristine-ts/class-validator";
import {McpModuleKeyname} from "./mcp.module.keyname";
import {McpConfigurationKeys} from "./mcp.configuration-keys";

export * from "./decorators/decorators";
export * from "./dispatchers/dispatchers";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./interfaces/interfaces";
export * from "./managers/managers";
export * from "./models/models";
export * from "./transports/transports";

export * from "./mcp.configuration-keys";
export * from "./mcp.module.keyname";
export * from "./mcp.protocol-versions";

/**
 * The MCP module. Import it into your application module, then expose methods of your
 * `@injectable()` services with `@mcpTool`.
 *
 * The package implements the Model Context Protocol itself and adds no third-party dependency:
 * the tool input schemas come from the `@pristine-ts/class-validator` decorators you already use
 * for validation (through its `JsonSchemaGenerator`), and `McpDispatcher` speaks both the
 * stateless 2026-07-28 revision and the `initialize`-based revisions before it.
 */
export const McpModule: ModuleInterface = {
  keyname: McpModuleKeyname,
  importModules: [
    CommonModule,
    DataMappingModule,
    LoggingModule,
  ],
  providerRegistrations: [
    {
      token: JsonSchemaGenerator,
      useValue: new JsonSchemaGenerator(),
    },
    {
      token: Validator,
      useValue: new Validator(),
    },
  ],
  configurationDefinitions: [
    /**
     * The server name sent in `serverInfo`.
     */
    {
      parameterName: McpConfigurationKeys.ServerName,
      isRequired: false,
      defaultValue: "pristine-mcp-server",
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_MCP_SERVER_NAME"),
      ],
    },
    /**
     * The server version sent in `serverInfo`.
     */
    {
      parameterName: McpConfigurationKeys.ServerVersion,
      isRequired: false,
      defaultValue: "1.0.0",
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_MCP_SERVER_VERSION"),
      ],
    },
    /**
     * Natural-language guidance for the model on how to use this server. Empty means none.
     */
    {
      parameterName: McpConfigurationKeys.ServerInstructions,
      isRequired: false,
      defaultValue: "",
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_MCP_SERVER_INSTRUCTIONS"),
      ],
    },
    /**
     * The browser origins allowed to call the Streamable HTTP endpoint, as a comma-separated
     * string or a `string[]`. A request with any other `Origin` header gets a 403, which blocks
     * DNS-rebinding attacks on a local server. Empty (the default) refuses every request that
     * carries an `Origin`; MCP clients that are not browsers send none.
     */
    {
      parameterName: McpConfigurationKeys.HttpAllowedOrigins,
      isRequired: false,
      defaultValue: "",
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_MCP_HTTP_ALLOWED_ORIGINS"),
      ],
    },
  ],
};
