import "reflect-metadata"
import {DataTransformerBuilder} from "./data-transformer.builder";
import {DataTransformerProperty} from "./data-transformer.property";
import {LowercaseNormalizer} from "../normalizers/lowercase.normalizer";

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

    it("should support being exported and then re-imported", () => {
        const dataTransformerBuilder = new DataTransformerBuilder();
        const builder = dataTransformerBuilder
            .addBeforeRowTransformInterceptor("first_interceptor")
            .addBeforeRowTransformInterceptor("second_interceptor")
            .addAfterRowTransformInterceptor("first_interceptor")
            .addAfterRowTransformInterceptor("second_interceptor")
            .add()
                .setSourceProperty("0")
                .setDestinationProperty("name")
                .excludeNormalizer(LowercaseNormalizer.name)
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

        const exportedBuilder = builder.export();


        const serializedObject: any = {
            "normalizers": [],
            "beforeRowTransformInterceptors":[{"key":"first_interceptor"},{"key":"second_interceptor"}],
            "afterRowTransformInterceptors":[{"key":"first_interceptor"},{"key":"second_interceptor"}],
            "properties":{
                "0":{
                    "sourceProperty":"0",
                    "destinationProperty":"name",
                    "isOptional": false,
                    "normalizers": [],
                    "excludedNormalizers": {
                        [LowercaseNormalizer.name]: true,
                    }
                },
                "1": {
                    "sourceProperty":"1",
                    "destinationProperty":"province",
                    "isOptional": false,
                    "normalizers": [
                        {
                            "key": LowercaseNormalizer.name
                        }
                    ],
                    "excludedNormalizers": {}
                },
                "2": {
                    "sourceProperty": "2",
                    "destinationProperty": "total",
                    "isOptional": false,
                    "normalizers": [],
                    "excludedNormalizers": {},
                }
            },
        };

        const stringifiedObject = JSON.stringify(serializedObject);

        expect(exportedBuilder).toBe(stringifiedObject);

        // Create a new builder and import the serializedObject.

        const importedBuilder = new DataTransformerBuilder();
        importedBuilder.import(stringifiedObject);

        expect(importedBuilder.normalizers.length).toBe(0);
        expect(importedBuilder.beforeRowTransformInterceptors.length).toBe(2);
        expect(importedBuilder.afterRowTransformInterceptors.length).toBe(2);
        expect(Object.keys(importedBuilder.properties).length).toBe(3);
        expect(importedBuilder.properties[0].normalizers.length).toBe(0)
        expect(importedBuilder.properties[0].excludedNormalizers.size).toBe(1)
        expect(importedBuilder.properties[0].isOptional).toBeFalsy();
        expect(importedBuilder.properties[0].sourceProperty).toBe("0");
        expect(importedBuilder.properties[0].destinationProperty).toBe("name");

        expect(importedBuilder.properties[1].normalizers.length).toBe(1)
        expect(importedBuilder.properties[1].excludedNormalizers.size).toBe(0)
        expect(importedBuilder.properties[1].isOptional).toBeFalsy();
        expect(importedBuilder.properties[1].sourceProperty).toBe("1");
        expect(importedBuilder.properties[1].destinationProperty).toBe("province");

        expect(importedBuilder.properties[2].normalizers.length).toBe(0)
        expect(importedBuilder.properties[2].excludedNormalizers.size).toBe(0)
        expect(importedBuilder.properties[2].isOptional).toBeFalsy();
        expect(importedBuilder.properties[2].sourceProperty).toBe("2");
        expect(importedBuilder.properties[2].destinationProperty).toBe("total");
    })
});