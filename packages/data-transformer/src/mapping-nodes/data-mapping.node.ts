import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {DataMappingLeaf} from "./data-mapping.leaf";

export class DataMappingNode {
    public type: DataMappingNodeTypeEnum = DataMappingNodeTypeEnum.Node;
    public nodes: DataMappingNode[] = [];
    public leaves: DataMappingLeaf[] = [];

    public parent?: DataMappingNode;

    constructor(private readonly root: DataMappingTree) {
    }

    /**
     * The DataMappingNode can only have one sourceProperty assigned. We need one sourceProperty to understand how to
     * navigate through the source object to pass the exact properties to the leaf nodes;
     */
    public sourceProperty: string;

    public destinationProperty: string;
}