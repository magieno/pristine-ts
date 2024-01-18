import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataNormalizerAlreadyAdded} from "../errors/data-normalizer-already-added.error";
import {DataMappingBuilder} from "../builders/data-mapping.builder";
import {DataMappingNode} from "./data-mapping.node";
import {DataTransformerSourcePropertyNotFoundError} from "../errors/data-transformer-source-property-not-found.error";
import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";

export class DataMappingLeaf {
    /**
     * This property represents the property referenced in the `source` object.
     */
    public sourceProperty!: string;

    /**
     * This property represents the property referenced in the `destination` object.
     */
    public destinationProperty!: string;

    /**
     * This property contains an array of Normalizers to apply sequentially when mapping this property.
     */
    public normalizers: { key: DataNormalizerUniqueKey, options: any}[] = [];

    /**
     * This property contains an array of Normalizers that must be excluded from normalizers defined by parents.
     */
    public excludedNormalizers: Set<DataNormalizerUniqueKey> = new Set<DataNormalizerUniqueKey>();

    /**
     * This method specified whether it's possible that this element not be present in the `source` object.
     */
    public isOptional: boolean = false;

    public constructor(
        private readonly root: DataMappingBuilder,
        public readonly parent: DataMappingNode | DataMappingBuilder,
        public readonly type: DataMappingNodeTypeEnum = DataMappingNodeTypeEnum.Leaf,
        ) {
    }

    /**
     * This is a setter for `sourceProperty`.
     * @param sourceProperty
     */
    public setSourceProperty(sourceProperty: string): DataMappingLeaf {
        this.sourceProperty = sourceProperty;
        return this;
    }

    /**
     * This is a setter for `destinationProperty`.
     * @param destinationProperty
     */
    public setDestinationProperty(destinationProperty: string): DataMappingLeaf {
        this.destinationProperty = destinationProperty;
        return this;
    }

    /**
     * This is a setter for `isOptional`.
     * @param isOptional
     */
    public setIsOptional(isOptional: boolean): DataMappingLeaf {
        this.isOptional = isOptional;

        return this;
    }

    /**
     * This methods adds a normalizer but checks that this normalizer hasn't been added already (either at the root) or
     * directly on this leaf.
     *
     * @param normalizerUniqueKey
     * @param options
     */
    public addNormalizer(normalizerUniqueKey: DataNormalizerUniqueKey, options?: any): DataMappingLeaf {
        if(this.hasNormalizer(normalizerUniqueKey)) {
            throw new DataNormalizerAlreadyAdded("The data normalizer '" + normalizerUniqueKey + "' has already been added to the leaf with destination property: '" + this.destinationProperty + "'.", normalizerUniqueKey, options)
        }

        if(this.root.hasNormalizer(normalizerUniqueKey)) {
            throw new DataNormalizerAlreadyAdded("The data normalizer '" + normalizerUniqueKey + "' has already been added to the root and cannot be also added to the leaf with destination property: '" + this.destinationProperty + "'.", normalizerUniqueKey, options)
        }

        this.normalizers.push({
            key: normalizerUniqueKey,
            options,
        });

        return this;
    }

    /**
     * This method simply returns whether the normalizer was already added to this node.
     * @param normalizerUniqueKey
     */
    public hasNormalizer(normalizerUniqueKey: DataNormalizerUniqueKey): boolean {
        return this.normalizers.find(element => element.key === normalizerUniqueKey) !== undefined;
    }

    /**
     * This method adds a normalizer that must be excluded from the normalizers applied at a higher level.à
     * @param normalizerUniqueKey
     */
    public excludeNormalizer(normalizerUniqueKey: DataNormalizerUniqueKey): DataMappingLeaf {
        if(this.excludedNormalizers.has(normalizerUniqueKey)) {
            throw new DataNormalizerAlreadyAdded("The EXCLUDED data normalizer '" + normalizerUniqueKey + "' has already been added to this source property: '" + this.sourceProperty + "'.", normalizerUniqueKey)
        }

        this.excludedNormalizers.add(normalizerUniqueKey);

        return this;
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
     * @param source
     * @param destination
     * @param normalizersMap
     */
    public async map(source: any, destination: any, normalizersMap: { [key in DataNormalizerUniqueKey]: DataNormalizerInterface<any, any> }) {
        if(source.hasOwnProperty(this.sourceProperty) === false) {
            if(this.isOptional) {
                return
            }

            throw new DataTransformerSourcePropertyNotFoundError("The property '" + this.sourceProperty + "' isn't found in the Source object and isn't marked as Optional. If you want to ignore this property, use the 'setIsOptional(true)' method in the builder.", this.sourceProperty)
        }

        let value = source[this.sourceProperty];
        const normalizers = this.root.normalizers.filter(element => this.excludedNormalizers.has(element.key) === false);
        normalizers.push(...this.normalizers);

        normalizers.forEach(element => {
            const normalizer = normalizersMap[element.key];
            value = normalizer.normalize(value, element.options);
        })

        destination[this.destinationProperty] = value;

        return;
    }

    /**
     * This method imports a schema.
     *
     * @param schema
     */
    public import(schema: any) {
        this.normalizers = schema.normalizers;

        this.excludedNormalizers = new Set<DataNormalizerUniqueKey>()
        if(schema.hasOwnProperty("excludedNormalizers")) {
            for(const item in schema.excludedNormalizers) {
                this.excludeNormalizer(item);
            }
        }

        this.isOptional = schema.isOptional;
        this.sourceProperty = schema.sourceProperty;
        this.destinationProperty = schema.destinationProperty;
    }

    /**
     * This method exports this node.
     */
    public export(): any {
        return {
            "_type": this.type,
            "sourceProperty": this.sourceProperty,
            "destinationProperty": this.destinationProperty,
            "isOptional": this.isOptional,
            "normalizers": this.normalizers,
            "excludedNormalizers": this.excludedNormalizers,
        }
    }
}