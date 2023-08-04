import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataNormalizerAlreadyAdded} from "../errors/data-normalizer-already-added.error";
import {DataTransformerBuilder} from "./data-transformer.builder";

export class DataTransformerProperty {
    public sourceProperty!: string;
    public destinationProperty!: string;
    public normalizers: { [id in DataNormalizerUniqueKey]: { options: any}} = {};

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

    public addNormalizer(normalizerUniqueKey: string, options?: any): DataTransformerProperty {
        if(this.normalizers[normalizerUniqueKey] !== undefined) {
            throw new DataNormalizerAlreadyAdded("The data normalizer '" + normalizerUniqueKey + "' has already been added to this source property: '" + this.sourceProperty + "'.", normalizerUniqueKey, options)
        }

        if(this.builder.normalizers) {
            throw new DataNormalizerAlreadyAdded("The data normalizer '" + normalizerUniqueKey + "' has already been added to the builder and cannot be also added to this source property: '" + this.sourceProperty + "'.", normalizerUniqueKey, options)
        }

        this.normalizers[normalizerUniqueKey] = {
            options,
        };

        return this;
    }

    public end(): DataTransformerBuilder {
        this.builder.addNewProperty(this);

        return this.builder;
    }
}