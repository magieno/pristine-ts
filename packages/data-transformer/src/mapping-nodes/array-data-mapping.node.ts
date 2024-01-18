import {DataMappingNode} from "./data-mapping.node";
import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {DataMappingBuilder} from "../builders/data-mapping.builder";
import {DataMappingLeaf} from "./data-mapping.leaf";
import {BaseDataMappingNode} from "./base-data-mapping.node";

/**
 * We need an array node because the behaviour when mapping an array is different. For each element in the source property,
 * we will
 */
export class ArrayDataMappingNode extends BaseDataMappingNode{
    public type: DataMappingNodeTypeEnum = DataMappingNodeTypeEnum.Array;

    public sourceProperty!: string;
    public destinationProperty!: string;

    constructor(public readonly root: DataMappingBuilder,
                public readonly parent: DataMappingNode | DataMappingBuilder) {
        super();
    }

    public setSourceProperty(sourceProperty: string): ArrayDataMappingNode {
        this.sourceProperty = sourceProperty;
        return this;
    }
    public setDestinationProperty(destinationProperty: string): ArrayDataMappingNode {
        this.destinationProperty = destinationProperty;
        return this;
    }

    /**
     * You don't necessarily have to call the set method. If you have an array of
     * simply types: string[] for example, you can simply skip this. The sourceProperty will be directly
     * assigned to destinationProperty.
     *
     * For now, you won't be able to normalize each individual inside of it though.
     */
    public set() {
        return new DataMappingNode(this.root, this);
    }


    public end(): DataMappingNode | DataMappingBuilder {
        this.parent.addNode(this)

        return this.parent;
    }
}