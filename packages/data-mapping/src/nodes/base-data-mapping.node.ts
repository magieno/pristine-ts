import {DataMappingNode} from "./data-mapping.node";
import {DataMappingLeaf} from "./data-mapping.leaf";
import {UndefinedSourcePropertyError} from "../errors/undefined-source-property.error";

export abstract class BaseDataMappingNode {
    public nodes: {[sourceProperty in string]: DataMappingNode | DataMappingLeaf} = {};

    /**
     * This method is called by the node itself to tell its parent that it has been build and is ready to be added.
     * We use this mechanism to force the `end()` method on the leaf to be called so we can do some validations before
     * adding it to the tree.
     *
     * @param node
     */
    public addNode(node: DataMappingLeaf | DataMappingNode) {
        if(node.sourceProperty === undefined) {
            throw new UndefinedSourcePropertyError(node);
        }

        this.nodes[node.sourceProperty] = node;
    }


}