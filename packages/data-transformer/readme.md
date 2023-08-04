enum Province {
    Quebec = "Quebec"
}



class NumberNormalizerOptions {
    public significantDigits = 2;

    public test?: string;

    public test2: string = "";

    public constructor(options: NumberNormalizerOptions) {
        // Do a smart override if the value isn't there, don't override the default value.
    }
}

class NumberNormalizer implements DataNormalizer<number, NumberNormalizerOptions>{
    getUniqueKey(): DataNormalizerUniqueKey {
        return NumberNormalizer.name;
    }

    normalize(source: any): number {
        // Transform source into a number;
        return 0;
    }
}

class LowerCaseNormalizer implements DataNormalizer<string, any> {
    getUniqueKey(): DataNormalizerUniqueKey {
        return LowerCaseNormalizer.name;
    }

    normalize(source: any, options: any): string {
        return source.toLowerCase();
    }
}

class ProvinceDataNormalizer implements DataNormalizer<Province, any> {
    getUniqueKey(): DataNormalizerUniqueKey {
        return ProvinceDataNormalizer.name;
    }

    normalize(value: any, options: any): Province {
        switch (value) {
            case "quebec":
            case "pq":
            case "qc":
                return Province.Quebec;
        }
        return Province.Quebec;
    }
}

class DataNormalizerAlreadyAdded extends Error {}

class DataTransformerProperty {
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
            throw new DataNormalizerAlreadyAdded("The data normalizer '" + normalizerUniqueKey + "' has already been added to this source property: '" + this.sourceProperty + "'.")
        }

        if(this.builder.normalizers) {
            throw new DataNormalizerAlreadyAdded("The data normalizer '" + normalizerUniqueKey + "' has already been added to the builder and cannot be also added to this source property: '" + this.sourceProperty + "'.")
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

class DataTransformerBuilder {
    public normalizers: { [id in DataNormalizerUniqueKey]: { options: any}} = {};

    public destination: any;

    public properties: {[sourceProperty in string]: DataTransformerProperty} = {}

    public addNormalizer(normalizerUniqueKey: string, options?: any): DataTransformerBuilder {
        if(this.normalizers[normalizerUniqueKey] !== undefined) {
            throw new DataNormalizerAlreadyAdded("The data normalizer '" + normalizerUniqueKey + "' has already been added to this builder.")
        }

        this.normalizers[normalizerUniqueKey] = {
            options,
        };
        return this;
    }

    public setDestination(destination: any): DataTransformerBuilder {
        this.destination = destination;

        return this;
    }

    public add() {
        return new DataTransformerProperty(this);
    }

    public addNewProperty(property: DataTransformerProperty) {
        this.properties[property.sourceProperty] = property;
    }
}

class DataTransformer {
    public constructor(
        private readonly dataNormalizers: DataNormalizer<any, any>[]) {
    }
}

class TestDestination {
    province: Province;

    nonEligibleDividendNonConnected: number;
}
/*
*   We want the ability to map a source value to a destination value.
*   Doing so, we want to use TypeScript as much as possible.
*   We want the ability to map enums without an enum being written as it should. So, we need to have "normalizers" that
*   know how to convert a source value to the destination. In the case of the enum Province, let's say the source has
*   "qc or pq", we want a way for the ProvinceTransformer to associate that with the Province.Quebec enum. This is a transformer.
*   We want a clean interface that is clear and uses a builder like approach so we can easily understand for each value what is
*   and isn't being applied.
*   Some transformers, we might want to apply it for every property while being able to maintain control over each property.
*/

// Code for each mapping. We could even maybe export this mapping and allow it to be saved and restored.
new DataTransformerBuilder()
    .addNormalizer(LowerCaseNormalizer.name)
    .setDestination(TestDestination)
    .add()
        .setSourceProperty("IDENT.Ident8[1]")
        .addNormalizer(ProvinceDataNormalizer.name)
        .setDestinationProperty("province")
        .end()
    .add()
        .setSourceProperty("FDDIV.SLIPA[1].TtadivA1")
        .addNormalizer(NumberNormalizer.name, new NumberNormalizerOptions({
            significantDigits: 3,
            test2: "",
        }))
        .setDestinationProperty("nonEligibleDividendNonConnected")
        .end()
