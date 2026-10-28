import "reflect-metadata";
import {McpModule, McpModuleKeyname, McpToolCatalog, mcpTool} from "./mcp.module";

describe("McpModule", () => {
  it("should export the module and its public surface", () => {
    expect(McpModule.keyname).toBe(McpModuleKeyname);
    expect(McpToolCatalog).toBeDefined();
    expect(mcpTool).toBeDefined();
  });
});
