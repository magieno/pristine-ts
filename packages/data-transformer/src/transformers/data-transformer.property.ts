import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataNormalizerAlreadyAdded} from "../errors/data-normalizer-already-added.error";
import {DataTransformerBuilder} from "./data-transformer.builder";

export class DataTransformerProperty {
    public sourceProperty!: string;
    public destinationProperty!: string;
    public normalizers: { key: DataNormalizerUniqueKey, options: any}[] = [];
    public excludedNormalizers: Set<DataNormalizerUniqueKey> = new Set<DataNormalizerUniqueKey>();
    public isOptional: boolean = false;

    public constructor(private readonly builder: DataTransformerBuilder) {
    }

    public setSourceProperty(sourceProperty: string): DataTransformerProperty {
        this.sourceProperty = sourceProperty;
        return this;
    }
    public setDestinationProperty(destinationProperty: string): DataTransformerProperty {
        this.destinationProperty = destinationProperty;
        return this;
    }

    public addNormalizer(normalizerUniqueKey: DataNormalizerUniqueKey, options?: any): DataTransformerProperty {
        if(this.hasNormalizer(normalizerUniqueKey)) {
            throw new DataNormalizerAlreadyAdded("The data normalizer '" + normalizerUniqueKey + "' has already been added to this source property: '" + this.sourceProperty + "'.", normalizerUniqueKey, options)
        }

        if(this.builder.hasNormalizer(normalizerUniqueKey)) {
            throw new DataNormalizerAlreadyAdded("The data normalizer '" + normalizerUniqueKey + "' has already been added to the builder and cannot be also added to this source property: '" + this.sourceProperty + "'.", normalizerUniqueKey, options)
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

    public excludeNormalizer(normalizerUniqueKey: DataNormalizerUniqueKey): DataTransformerProperty {
        if(this.excludedNormalizers.has(normalizerUniqueKey)) {
            throw new DataNormalizerAlreadyAdded("The EXCLUDED data normalizer '" + normalizerUniqueKey + "' has already been added to this source property: '" + this.sourceProperty + "'.", normalizerUniqueKey)
        }

        this.excludedNormalizers.add(normalizerUniqueKey);

        return this;
    }

    public setIsOptional(isOptional: boolean): DataTransformerProperty {
        this.isOptional = isOptional;

        return this;
    }

    public end(): DataTransformerBuilder {
        this.builder.addNewProperty(this);

        return this.builder;
    }

}