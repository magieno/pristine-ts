
class LowerCaseNormalizer implements DataNormalizer<string, any> {
    getUniqueKey(): DataNormalizerUniqueKey {
        return LowerCaseNormalizer.name;
    }

    normalize(source: any, options: any): string {
        return source.toLowerCase();
    }
}

class DataTransformer {
    public constructor(
        private readonly dataNormalizers: DataNormalizer<any, any>[]) {
    }
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
