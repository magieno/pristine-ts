import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataNormalizerAlreadyAdded} from "../errors/data-normalizer-already-added.error";
import {DataTransformerBuilder} from "../transformers/data-transformer.builder";
import {DataMappingBuilder} from "../builders/data-mapping.builder";
import {DataMappingNode} from "./data-mapping.node";
import {DataMappingTree} from "./data-mapping.tree";

export class DataMappingLeaf {
    public type: DataMappingNodeTypeEnum = DataMappingNodeTypeEnum.Leaf;

    public sourceProperties: string[] = [];

    public destinationProperty: string;

    public normalizers: { key: DataNormalizerUniqueKey, options: any}[] = [];

    public excludedNormalizers: Set<DataNormalizerUniqueKey> = new Set<DataNormalizerUniqueKey>();

    public isOptional: boolean;

    public constructor(
        private readonly parent: DataMappingNode,
        private readonly root: DataMappingTree,
        ) {
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

    public import(schema: any) {
        this.normalizers = schema.normalizers;

        this.excludedNormalizers = new Set<DataNormalizerUniqueKey>()
        if(schema.hasOwnProperty("excludedNormalizers")) {
            for(const item in schema.excludedNormalizers) {
                this.excludeNormalizer(item);
            }
        }

        this.isOptional = schema.isOptional;
        this.sourceProperties = schema.sourceProperties;
        this.destinationProperty = schema.destinationProperty;
    }

    public export(): any {
        return {
            "sourceProperties": this.sourceProperties,
            "destinationProperty": this.destinationProperty,
            "isOptional": this.isOptional,
            "normalizers": this.normalizers,
            "excludedNormalizers": this.excludedNormalizers,
        }
    }
}