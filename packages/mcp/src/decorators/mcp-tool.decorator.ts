import "reflect-metadata";
import {McpToolOptionsInterface} from "../interfaces/mcp-tool-options.interface";
import {McpToolRegistrationInterface} from "../interfaces/mcp-tool-registration.interface";

/**
 * Every method decorated with `@mcpTool`, in declaration order. The tool catalog reads it the same
 * way the router reads the `controllerRegistry`.
 */
export const mcpToolRegistry: McpToolRegistrationInterface[] = [];

/**
 * Exposes a method as an MCP tool. The class must be `@injectable()`: it is resolved from the
 * container on every call.
 *
 * The method receives the validated arguments (an instance of `inputType`) and an
 * `McpToolContext`. It returns a string (sent as text), any other JSON value (sent as structured
 * content), or an `McpToolResult` for full control.
 *
 * ```ts
 * @injectable()
 * export class TodoTools {
 *   @mcpTool({name: "create_todo", description: "Create a to-do.", inputType: CreateTodoInput})
 *   async createTodo(input: CreateTodoInput) { ... }
 * }
 * ```
 *
 * @param options The name, description and input type of the tool.
 */
export const mcpTool = (options: McpToolOptionsInterface) => {
  return (
    /**
     * The prototype of the class that owns the method.
     */
    target: any,
    /**
     * The method on which the decorator is used.
     */
    propertyKey: string,
    /**
     * The descriptor of the method.
     */
    descriptor: PropertyDescriptor,
  ) => {
    mcpToolRegistry.push({
      classConstructor: target.constructor,
      methodKeyname: propertyKey,
      options,
    });
  };
}
