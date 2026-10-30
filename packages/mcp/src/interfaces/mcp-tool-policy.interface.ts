import {McpToolDefinitionInterface} from "./mcp-tool-definition.interface";
import {McpToolPolicyContextInterface} from "./mcp-tool-policy-context.interface";

/**
 * Decides which tools a caller may see and call, for example from a setting the user controls.
 *
 * Tag the implementing class with `@tag(ServiceDefinitionTagEnum.McpToolPolicy)` (and
 * `@injectable()`). A tool is served only when every policy allows it. A tool that a policy refuses
 * is not in `tools/list`, and `tools/call` answers it as an unknown tool, so the caller cannot tell
 * it from a tool that does not exist.
 *
 * ```ts
 * @tag(ServiceDefinitionTagEnum.McpToolPolicy)
 * @injectable()
 * export class SettingsToolPolicy implements McpToolPolicyInterface {
 *   constructor(private readonly settings: SettingsService) {}
 *
 *   isToolAllowed(tool: McpToolDefinitionInterface): boolean {
 *     return this.settings.disabledTools.includes(tool.name) === false;
 *   }
 * }
 * ```
 */
export interface McpToolPolicyInterface {
  /**
   * Returns `true` to serve the tool to this request, `false` to hide it.
   *
   * @param tool The definition of the tool, as `tools/list` sends it.
   * @param context What the policy knows about the request.
   */
  isToolAllowed(tool: McpToolDefinitionInterface, context: McpToolPolicyContextInterface): boolean | Promise<boolean>;
}
