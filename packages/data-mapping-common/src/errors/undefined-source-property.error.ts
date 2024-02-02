import {DataMappingLeaf} from "../nodes/data-mapping.leaf";
import {DataMappingNode} from "../nodes/data-mapping.node";

/**
 * This Error is thrown when you are trying to add a Node which has an undefined sourceProperty value.
 */
export class UndefinedSourcePropertyError extends Error {

    public constructor(node: DataMappingLeaf | DataMappingNode) {
        super("The `sourceProperty` property of the Node cannot be undefined to be added as a Node to its parent.");

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, UndefinedSourcePropertyError.prototype);
    }
}
