import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {DataMappingLeaf} from "./data-mapping.leaf";
import {DataMappingBuilder} from "../builders/data-mapping.builder";
import {BaseDataMappingNode} from "./base-data-mapping.node";
import {DataMappingSourcePropertyNotFoundError} from "../errors/data-mapping-source-property-not-found.error";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";
import {
    ArrayDataMappingNodeInvalidSourcePropertyTypeError
} from "../errors/array-data-mapping-node-invalid-source-property-type.error";
import {ClassConstructor, plainToInstance} from "class-transformer";
import {DataMapperOptions} from "../options/data-mapper.options";

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

    /**
     * IMPORTANT: This property is not serializable. It will be lost during the export.
     */
    public destinationType?: ClassConstructor<any>;

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
     * This is a setter for `destinationType`.
     * @param destinationType
     */
    public setDestinationType(destinationType: ClassConstructor<any>): DataMappingNode {
        this.destinationType = destinationType;
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
        return new DataMappingLeaf(this.root, this, DataMappingNodeTypeEnum.ScalarArray);
    }

    /**
     * This method adds an array of objects allowing to define a node for each property in the object. Each object in
     * the array will be treated as being the same.
     */
    public addArrayOfObjects(): DataMappingNode {
        return new DataMappingNode(this.root, this, DataMappingNodeTypeEnum.ObjectArray);
    }

    /**
     * This method adds this node to its parent and returns the parent.
     */
    public end(): DataMappingNode | DataMappingBuilder {
        // todo: Validate that we actually have all the properties needed (sourceProperty and destinationProperty) for example.
        this.parent.addNode(this)

        return this.parent;
    }

    /**
     * This method maps the `sourceProperty` from the `source` object and maps it to the `destinationProperty` of the
     * `destination` object while applying the normalizers.
     *
     * @param source
     * @param destination
     * @param normalizersMap
     */
    public async map(source: any, destination: any, normalizersMap: { [key in DataNormalizerUniqueKey]: DataNormalizerInterface<any, any> }, options?: DataMapperOptions) {
        if(source.hasOwnProperty(this.sourceProperty) === false) {
            if(this.isOptional) {
                return
            }

            throw new DataMappingSourcePropertyNotFoundError("The property '" + this.sourceProperty + "' isn't found in the Source object and isn't marked as Optional. If you want to ignore this property, use the 'setIsOptional(true)' method in the builder.", this.sourceProperty)
        }

        const sourceElement = source[this.sourceProperty];

        if(destination[this.destinationProperty] === undefined) {
            if(this.type === DataMappingNodeTypeEnum.ObjectArray) {
                destination[this.destinationProperty] = [];
            } else {
                if(this.destinationType) {
                    destination[this.destinationProperty] = plainToInstance(this.destinationType, {});
                } else {
                    destination[this.destinationProperty] = {}
                }

                if(options?.excludeExtraneousValues === false) {
                    Object.keys(source[this.sourceProperty]).forEach(property => {
                        destination[this.destinationProperty][property] = source[this.sourceProperty][property];
                    })
                }
            }
        }

        const destinationElement = destination[this.destinationProperty];

        if(this.type === DataMappingNodeTypeEnum.ObjectArray) {
            // This means that the source[propertyKey] contains an array of objects and each object should be mapped
            const array = source[this.sourceProperty];

            if(Array.isArray(array) === false) {
                throw new ArrayDataMappingNodeInvalidSourcePropertyTypeError(`According to your schema, the property '${this.sourceProperty}' in the source object must contain an Array of objects. Instead, it contains: '${typeof array}'.`, this.sourceProperty);
            }

            for (const element of array) {
                let dest = {};

                if(this.destinationType) {
                    dest = plainToInstance(this.destinationType, {})
                }

                for (const key in this.nodes) {
                    if(this.nodes.hasOwnProperty(key) === false) {
                        continue;
                    }

                    const node = this.nodes[key];

                    await node.map(element, dest, normalizersMap, options);
                }

                destinationElement.push(dest);
            }

            return;
        }

        // When the current node is not an array, we simply iterate
        for (const key in this.nodes) {
            if(this.nodes.hasOwnProperty(key) === false) {
                continue;
            }

            const node = this.nodes[key];

            await node.map(sourceElement, destinationElement, normalizersMap, options);
        }
    }

    /**
     * This method imports a schema.
     *
     * @param schema
     */
    public import(schema: any) {
        this.sourceProperty = schema.sourceProperty;
        this.destinationProperty = schema.destinationProperty;
        this.isOptional = schema.isOptional;
        this.nodes = {};

        const nodes = schema.nodes;

        for(const key in nodes) {
            if(nodes.hasOwnProperty(key) === false) {
                continue;
            }

            const nodeInfo = nodes[key];

            const type: DataMappingNodeTypeEnum = nodeInfo["_type"];

            switch (type) {
                case DataMappingNodeTypeEnum.ScalarArray:
                case DataMappingNodeTypeEnum.Leaf:
                    const leaf = new DataMappingLeaf(this.root, this, type);
                    leaf.import(nodeInfo);
                    this.nodes[leaf.sourceProperty] = leaf;
                    continue;

                case DataMappingNodeTypeEnum.Node:
                case DataMappingNodeTypeEnum.ObjectArray:
                    const node = new DataMappingNode(this.root, this, type);
                    node.import(nodeInfo);
                    this.nodes[node.sourceProperty] = node;
                    continue;
            }
        }
    }

    /**
     * This method exports this node.
     */
    public export() {
        const nodes = this.nodes;

        for (const key in nodes) {
            if(nodes.hasOwnProperty(key) === false) {
                continue;
            }

            nodes[key] = nodes[key].export();
        }

        return {
            "_type": this.type,
            "sourceProperty": this.sourceProperty,
            "destinationProperty": this.destinationProperty,
            "isOptional": this.isOptional,
            "nodes": nodes,
        }
    }
}