import "reflect-metadata"
import {DataTransformerBuilder} from "./data-transformer.builder";
import {DataTransformerProperty} from "./data-transformer.property";

describe('Data Transformer Builder', () => {
    let dataTransformerBuilder: DataTransformerBuilder;

    beforeEach(() => {
        dataTransformerBuilder = new DataTransformerBuilder();
    })

    it("should properly add a normalizer", () => {
        const options = {
            "optionA": true,
        };

        dataTransformerBuilder.addNormalizer("normalizer", options);

        expect(dataTransformerBuilder.normalizers.length).toBe(1);
        expect(dataTransformerBuilder.normalizers[0].key).toBe("normalizer")
        expect(dataTransformerBuilder.normalizers[0].options).toBe(options);
    })

    it("should return if it has a normalizer or not", () => {
        const options = {
            "optionA": true,
        };

        dataTransformerBuilder.addNormalizer("normalizer", options);

        expect(dataTransformerBuilder.hasNormalizer("normalizer")).toBeTruthy();
        expect(dataTransformerBuilder.hasNormalizer("dafds")).toBeFalsy();
    })

    it("should properly add a new data transformer property", () => {
        expect(dataTransformerBuilder.add() instanceof DataTransformerProperty).toBeTruthy()
    })
});