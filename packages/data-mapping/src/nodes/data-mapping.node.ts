import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {DataMappingLeaf} from "./data-mapping.leaf";
import {DataMappingBuilder} from "../builders/data-mapping.builder";
import {BaseDataMappingNode} from "./base-data-mapping.node";
import {DataTransformerSourcePropertyNotFoundError} from "../errors/data-transformer-source-property-not-found.error";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";

export class DataMappingNode extends BaseDataMappingNode {
    /**
     * This property represents the property referenced in the `source` object.
     */
    public sourceProperty!: string;

    /**
     * This property represents the property referenced in the `destination` object.
     */
    public destinationProperty!: string;

    /**
     * This method specified whether it's possible that this element not be present in the `source` object.
     */
    public isOptional: boolean = false;

    constructor(public readonly root: DataMappingBuilder,
                public readonly parent: DataMappingNode | DataMappingBuilder,
                public readonly type: DataMappingNodeTypeEnum = DataMappingNodeTypeEnum.Node,
                ) {
        super();
    }

    /**
     * This is a setter for `sourceProperty`.
     * @param sourceProperty
     */
    public setSourceProperty(sourceProperty: string): DataMappingNode {
        this.sourceProperty = sourceProperty;
        return this;
    }

    /**
     * This is a setter for `destinationProperty`.
     * @param destinationProperty
     */
    public setDestinationProperty(destinationProperty: string): DataMappingNode {
        this.destinationProperty = destinationProperty;
        return this;
    }

    /**
     * This is a setter for `isOptional`.
     * @param isOptional
     */
    public setIsOptional(isOptional: boolean): DataMappingNode {
        this.isOptional = isOptional;

        return this;
    }

    /**
     * This property creates a new DataMappingLeaf and returns it. It doesn't add it yet. To do so, the `end()` method
     * must be called.
     */
    public add() {
        return new DataMappingLeaf(this.root, this);
    }

    /**
     * This method adds a nesting level. This should be used when the property contains an object and you want to map
     * this object into another object.
     */
    public addNestingLevel() {
        return new DataMappingNode(this.root, this);
    }

    /**
     * This method adds an array of Scalar allowing you to apply the normalizer on each scalar in the array. The
     * `sourceProperty` and `destinationProperty` correspond to the name of the property that is an array. But, the
     * values in the array will be normalized using the normalizer.
     *
     */
    public addArrayOfScalar(): DataMappingLeaf {
        return new DataMappingLeaf(this.root, this, DataMappingNodeTypeEnum.Array);
    }

    /**
     * This method adds an array of objects allowing to define a node for each property in the object. Each object in
     * the array will be treated as being the same.
     */
    public addArrayOfObjects(): DataMappingNode {
        return new DataMappingNode(this.root, this, DataMappingNodeTypeEnum.Array);
    }

    /**
     * This method adds this node to its parent and returns the parent.
     */
    public end(): DataMappingNode | DataMappingBuilder {
        // todo: Validate that we actually have all the properties needed (sourceProperty and destinationProperty) for example.
        this.parent.addNode(this)

        return this.parent;
    }

    public async map(source: any, destination: any, normalizersMap: { [key in DataNormalizerUniqueKey]: DataNormalizerInterface<any, any> }) {
        if(source.hasOwnProperty(this.sourceProperty) === false) {
            if(this.isOptional) {
                return
            }

            throw new DataTransformerSourcePropertyNotFoundError("The property '" + this.sourceProperty + "' isn't found in the Source object and isn't marked as Optional. If you want to ignore this property, use the 'setIsOptional(true)' method in the builder.", this.sourceProperty)
        }

        let sourceElement = source[this.sourceProperty];

        if(destination[this.destinationProperty] === undefined) {
            // todo: we need to get the expected Type of the `destination[this.destinationProperty]` and actually instantiate it.
            destination[this.destinationProperty] = {};
        }

        let destinationElement = destination[this.destinationProperty];

        for (let key in this.nodes) {
            if(this.nodes.hasOwnProperty(key) === false) {
                continue;
            }

            const node = this.nodes[key];

            await node.map(sourceElement, destinationElement, normalizersMap);
        }
    }
}