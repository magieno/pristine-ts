import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {DataMappingLeaf} from "./data-mapping.leaf";
import {DataMappingBuilder} from "../builders/data-mapping.builder";
import {DataTransformerProperty} from "../transformers/data-transformer.property";
import {UndefinedSourcePropertyError} from "../errors/undefined-source-property.error";
import {BaseDataMappingNode} from "./base-data-mapping.node";
import {ArrayDataMappingNode} from "./array-data-mapping.node";

export class DataMappingNode extends BaseDataMappingNode {
    public sourceProperty!: string;
    public destinationProperty!: string;

    constructor(public readonly root: DataMappingBuilder,
                public readonly parent: DataMappingNode | DataMappingBuilder,
                public readonly type: DataMappingNodeTypeEnum = DataMappingNodeTypeEnum.Node,
                ) {
        super();
    }

    public setSourceProperty(sourceProperty: string): DataMappingNode {
        this.sourceProperty = sourceProperty;
        return this;
    }
    public setDestinationProperty(destinationProperty: string): DataMappingNode {
        this.destinationProperty = destinationProperty;
        return this;
    }

    public add() {
        return new DataMappingLeaf(this.root, this);
    }

    public addNestingLevel() {
        return new DataMappingNode(this.root, this);
    }

    public addArray(): DataMappingNode {
        return new DataMappingNode(this.root, this, DataMappingNodeTypeEnum.Array);
    }

    public end(): DataMappingNode | DataMappingBuilder {
        // todo: Validate that we actually have all the properties needed (sourceProperty and destinationProperty) for example.
        this.parent.addNode(this)

        //@ts-ignore
        return this.parent;
    }
}