import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataNormalizerAlreadyAdded} from "../errors/data-normalizer-already-added.error";
import {DataTransformerBuilder} from "../transformers/data-transformer.builder";
import {DataMappingBuilder} from "../builders/data-mapping.builder";
import {DataMappingNode} from "./data-mapping.node";

export class DataMappingLeaf {
    public sourceProperty!: string;

    public destinationProperty!: string;

    public normalizers: { key: DataNormalizerUniqueKey, options: any}[] = [];

    public excludedNormalizers: Set<DataNormalizerUniqueKey> = new Set<DataNormalizerUniqueKey>();

    public isOptional: boolean = false;

    public constructor(
        private readonly root: DataMappingBuilder,
        public readonly parent: DataMappingNode | DataMappingBuilder,
        public readonly type: DataMappingNodeTypeEnum = DataMappingNodeTypeEnum.Leaf,
        ) {
    }

    public setSourceProperty(sourceProperty: string): DataMappingLeaf {
        this.sourceProperty = sourceProperty;
        return this;
    }

    public setDestinationProperty(destinationProperty: string): DataMappingLeaf {
        this.destinationProperty = destinationProperty;
        return this;
    }

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

    public hasNormalizer(normalizerUniqueKey: DataNormalizerUniqueKey): boolean {
        return this.normalizers.find(element => element.key === normalizerUniqueKey) !== undefined;
    }

    public excludeNormalizer(normalizerUniqueKey: DataNormalizerUniqueKey): DataMappingLeaf {
        if(this.excludedNormalizers.has(normalizerUniqueKey)) {
            throw new DataNormalizerAlreadyAdded("The EXCLUDED data normalizer '" + normalizerUniqueKey + "' has already been added to this source property: '" + this.sourceProperty + "'.", normalizerUniqueKey)
        }

        this.excludedNormalizers.add(normalizerUniqueKey);

        return this;
    }

    public setIsOptional(isOptional: boolean): DataMappingLeaf {
        this.isOptional = isOptional;

        return this;
    }

    public end(): DataMappingNode | DataMappingBuilder {
        // todo: Validate that we actually have all the properties needed (sourceProperty and destinationProperty) for example.
        this.parent.addNode(this)

        return this.parent;
    }

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