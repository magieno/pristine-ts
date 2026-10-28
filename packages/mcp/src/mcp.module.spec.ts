import "reflect-metadata";
import {McpModule, McpModuleKeyname, McpToolCatalog, JsonSchemaGenerator, mcpTool, mcpToolParameter} from "./mcp.module";

describe("McpModule", () => {
  it("should export the module and its public surface", () => {
    expect(McpModule.keyname).toBe(McpModuleKeyname);
    expect(McpToolCatalog).toBeDefined();
    expect(JsonSchemaGenerator).toBeDefined();
    expect(mcpTool).toBeDefined();
    expect(mcpToolParameter).toBeDefined();
  });
});
