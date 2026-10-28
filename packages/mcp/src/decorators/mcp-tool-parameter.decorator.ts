import "reflect-metadata";
import {PropertyMetadata} from "@pristine-ts/metadata";
import {McpToolParameterOptionsInterface} from "../interfaces/mcp-tool-parameter-options.interface";
import {McpMetadataKeynameEnum} from "../enums/mcp-metadata-keyname.enum";

/**
 * Documents a property of a tool's input class. The type, the constraints and whether the property
 * is required come from the `@pristine-ts/class-validator` decorators; this decorator adds what
 * they cannot say, such as the description the model reads.
 *
 * ```ts
 * export class CreateTodoInput {
 *   @mcpToolParameter({description: "The title of the to-do."})
 *   @IsString()
 *   @MaxLength(200)
 *   title: string;
 * }
 * ```
 *
 * @param options The description and extra schema keywords of the property.
 */
export const mcpToolParameter = (options: McpToolParameterOptionsInterface) => {
  return (
    /**
     * The prototype of the input class.
     */
    target: any,
    /**
     * The property on which the decorator is used.
     */
    propertyKey: string,
  ) => {
    PropertyMetadata.defineMetadata(target, propertyKey, McpMetadataKeynameEnum.ToolParameter, options);
    PropertyMetadata.propertySeen(target, propertyKey);
  };
}
