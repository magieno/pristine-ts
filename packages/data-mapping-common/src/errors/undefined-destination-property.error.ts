import {DataMappingLeaf} from "../nodes/data-mapping.leaf";
import {DataMappingNode} from "../nodes/data-mapping.node";

/**
 * Thrown when a Node is being committed to its parent without a `destinationProperty` set.
 */
export class UndefinedDestinationPropertyError extends Error {

  public constructor(node: DataMappingLeaf | DataMappingNode) {
    super("The `destinationProperty` property of the Node cannot be undefined to be added as a Node to its parent. Source property: '" + node.sourceProperty + "'.");

    Object.setPrototypeOf(this, UndefinedDestinationPropertyError.prototype);
  }
}
