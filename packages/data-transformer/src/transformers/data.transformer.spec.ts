import "reflect-metadata"
import {DataTransformer} from "./data.transformer";
import {LowercaseNormalizer} from "../normalizers/lowercase.normalizer";
import {DataTransformerBuilder} from "./data-transformer.builder";

describe('Data Transformer', () => {
    it("should properly transform", () => {
        const dataTransformer = new DataTransformer([new LowercaseNormalizer()]);

        const source = [{
            NAME: "Etienne Noel",
            province: "QUEBEC",
            TOTAL: 10,
        }];

        const dataTransformerBuilder = new DataTransformerBuilder();
        dataTransformerBuilder
            .add()
                .setSourceProperty("NAME")
                .setDestinationProperty("name")
                .end()
            .add()
                .setSourceProperty("province")
                .addNormalizer(LowercaseNormalizer.name)
                .setDestinationProperty("province")
                .end()
            .add()
                .setSourceProperty("TOTAL")
                .setDestinationProperty("total")
                .end();

        const destination = dataTransformer.transform(dataTransformerBuilder, source);

        expect(destination.length).toBe(1)

        expect(destination[0].name).toBeDefined()
        expect(destination[0].name).toBe("Etienne Noel");
        expect(destination[0].province).toBe("quebec");
        expect(destination[0].total).toBe(10);
    })
    it("should properly transform an array with numerical indices", () => {
        const dataTransformer = new DataTransformer([new LowercaseNormalizer()]);

        const source = [
            ["Etienne Noel", "QUEBEC", 10],
        ];

        const dataTransformerBuilder = new DataTransformerBuilder();
        dataTransformerBuilder
            .add()
                .setSourceProperty("0")
                .setDestinationProperty("name")
                .end()
            .add()
                .setSourceProperty("1")
                .addNormalizer(LowercaseNormalizer.name)
                .setDestinationProperty("province")
                .end()
            .add()
                .setSourceProperty("2")
                .setDestinationProperty("total")
                .end();

        const destination = dataTransformer.transform(dataTransformerBuilder, source);

        expect(destination.length).toBe(1)

        expect(destination[0].name).toBeDefined()
        expect(destination[0].name).toBe("Etienne Noel");
        expect(destination[0].province).toBe("quebec");
        expect(destination[0].total).toBe(10);
    })
});