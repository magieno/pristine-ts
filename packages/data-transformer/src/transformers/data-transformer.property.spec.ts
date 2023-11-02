import {DataTransformerProperty} from "./data-transformer.property";
import {DataTransformerBuilder} from "./data-transformer.builder";

describe('Data Transformer Property', () => {
    const dataTransformerBuilder: DataTransformerBuilder = new DataTransformerBuilder();
    let dataTransformerProperty: DataTransformerProperty;

    beforeEach(() => {
        dataTransformerProperty = new DataTransformerProperty(dataTransformerBuilder);
    })

    it("should set the Source Property correctly", () => {
        dataTransformerProperty.setSourceProperty("property");

        expect(dataTransformerProperty.sourceProperty).toBe("property")
    })

    it("should set the Destination Property correctly", () => {
        dataTransformerProperty.setDestinationProperty("property");

        expect(dataTransformerProperty.destinationProperty).toBe("property")
    })

    it("should add a normalizer correctly", () => {
        const options = {
            "optionA": true,
        };

        dataTransformerProperty.addNormalizer("normalizer", options);

        expect(dataTransformerProperty.normalizers.length).toBe(1);
        expect(dataTransformerProperty.normalizers[0].key).toBe("normalizer")
        expect(dataTransformerProperty.normalizers[0].options).toBe(options)
    })

    it("should return correctly if it has a normalizer correctly", () => {
        const options = {
            "optionA": true,
        };

        dataTransformerProperty.addNormalizer("normalizer", options);

        expect(dataTransformerProperty.hasNormalizer("normalizer")).toBeTruthy();
        expect(dataTransformerProperty.hasNormalizer("dafds")).toBeFalsy();
    })

    it("should add an excluded normalizer correctly", () => {
        const options = {
            "optionA": true,
        };

        dataTransformerProperty.excludeNormalizer("normalizer");

        expect(dataTransformerProperty.excludedNormalizers.size).toBe(1);
        expect(dataTransformerProperty.excludedNormalizers.has("normalizer")).toBeTruthy()
    })

    it("should set the IsOptional property", () => {
        dataTransformerProperty.setIsOptional(true);

        expect(dataTransformerProperty.isOptional).toBeTruthy();
    })

    it("should properly return the builder when calling end()", () => {
        expect(dataTransformerProperty.end()).toBe(dataTransformerBuilder);
    })
});