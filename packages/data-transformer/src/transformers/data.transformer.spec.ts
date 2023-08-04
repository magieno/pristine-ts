import "reflect-metadata"
import {DataTransformer} from "./data.transformer";
import {LowercaseNormalizer} from "../normalizers/lowercase.normalizer";
import {DataTransformerBuilder} from "./data-transformer.builder";

describe('Data Transformer', () => {
    it("should properly transform", () => {
        const dataTransformer = new DataTransformer([new LowercaseNormalizer()]);

        const source = {
            NAME: "Etienne Noel",
            province: "QUEBEC",
            TOTAL: 10,
        }

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
                .end()


        const destination = dataTransformer.transform(dataTransformerBuilder, source, {});

        expect(destination.name).toBeDefined()
        expect(destination.name).toBe("Etienne Noel");
        expect(destination.province).toBe("quebec");
        expect(destination.total).toBe(10);
    })
});