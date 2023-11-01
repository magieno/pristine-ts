import "reflect-metadata"
import {DataTransformer} from "./data.transformer";
import {LowercaseNormalizer} from "../normalizers/lowercase.normalizer";
import {DataTransformerBuilder} from "./data-transformer.builder";
import {DataTransformerInterceptorInterface} from "../interfaces/data-transformer-interceptor.interface";
import {DataTransformerInterceptorUniqueKeyType} from "../types/data-transformer-interceptor-unique-key.type";
import {DataTransformerRow} from "../types/data-transformer.row";
import 'jest-extended';
import {DataTransformerInterceptorNotFoundError} from "../errors/data-transformer-interceptor-not-found.error";
import {DataTransformerSourcePropertyNotFoundError} from "../errors/data-transformer-source-property-not-found.error";

describe('Data Transformer', () => {
    it("should properly transform", async () => {
        const dataTransformer = new DataTransformer([new LowercaseNormalizer()], []);

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

        const destination = await dataTransformer.transform(dataTransformerBuilder, source);

        expect(destination.length).toBe(1)

        expect(destination[0].name).toBeDefined()
        expect(destination[0].name).toBe("Etienne Noel");
        expect(destination[0].province).toBe("quebec");
        expect(destination[0].total).toBe(10);
    })

    it("should properly transform an array with numerical indices", async () => {
        const dataTransformer = new DataTransformer([new LowercaseNormalizer()], []);

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

        const destination = await dataTransformer.transform(dataTransformerBuilder, source);

        expect(destination.length).toBe(1)

        expect(destination[0].name).toBeDefined()
        expect(destination[0].name).toBe("Etienne Noel");
        expect(destination[0].province).toBe("quebec");
        expect(destination[0].total).toBe(10);
    })

    it("should properly call the before row transformers and respect the order of calls", async () => {
        const firstInterceptor: DataTransformerInterceptorInterface = {
            async beforeRowTransform(row: DataTransformerRow): Promise<DataTransformerRow> {
                return row;
            },
            async afterRowTransform(row: DataTransformerRow): Promise<DataTransformerRow> {
                return {
                    "after": row["name"] + row["province"] + row["total"] + row["added_property"],
                };
            },
            getUniqueKey(): DataTransformerInterceptorUniqueKeyType {
                return "first_interceptor";
            },
        }
        const secondInterceptor: DataTransformerInterceptorInterface = {
            async beforeRowTransform(row: DataTransformerRow): Promise<DataTransformerRow> {
                row[3] = "Property added in the beforeRowTransform";
                return row;
            },
            async afterRowTransform(row: DataTransformerRow): Promise<DataTransformerRow> {
                return row;
            },
            getUniqueKey(): DataTransformerInterceptorUniqueKeyType {
                return "second_interceptor";
            },
        }

        const beforeRowFirstInterceptorSpy = jest.spyOn(firstInterceptor, "beforeRowTransform")
        const afterRowFirstInterceptorSpy = jest.spyOn(firstInterceptor, "afterRowTransform")
        const beforeRowSecondInterceptorSpy = jest.spyOn(secondInterceptor, "beforeRowTransform")
        const afterRowSecondInterceptorSpy = jest.spyOn(secondInterceptor, "afterRowTransform")

        const dataTransformer = new DataTransformer([new LowercaseNormalizer()], [
            firstInterceptor,
            secondInterceptor,
        ]);

        const source = [
            ["Etienne Noel", "QUEBEC", 10],
        ];

        const dataTransformerBuilder = new DataTransformerBuilder();
        dataTransformerBuilder
            .addBeforeRowTransformInterceptor("first_interceptor")
            .addBeforeRowTransformInterceptor("second_interceptor")
            .addAfterRowTransformInterceptor("first_interceptor")
            .addAfterRowTransformInterceptor("second_interceptor")
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
                .end()
            .add()
                .setSourceProperty("3")
                .setDestinationProperty("added_property")
                .end();

        const transformedData: any[] = await dataTransformer.transform(dataTransformerBuilder, source);

        expect(beforeRowFirstInterceptorSpy).toHaveBeenCalledBefore(beforeRowSecondInterceptorSpy);
        expect(beforeRowSecondInterceptorSpy).toHaveBeenCalledBefore(afterRowFirstInterceptorSpy)
        expect(afterRowFirstInterceptorSpy).toHaveBeenCalledBefore(afterRowSecondInterceptorSpy);

        expect(transformedData[0]["after"]).toBe("Etienne Noelquebec10Property added in the beforeRowTransform")
    })

    it("should throw properly when before row transformer cannot be found", async () => {
        const dataTransformer = new DataTransformer([new LowercaseNormalizer()], []);

        const dataTransformerBuilder = new DataTransformerBuilder();
        dataTransformerBuilder
            .addBeforeRowTransformInterceptor("first_interceptor")
            .add()
            .setSourceProperty("0")
            .setDestinationProperty("name")
            .end()

       await expect(dataTransformer.transform(dataTransformerBuilder, [{"a": "a"}])).rejects.toThrowError(DataTransformerInterceptorNotFoundError);
    })

    it("should throw properly when after row transformer cannot be found", async () => {
        const dataTransformer = new DataTransformer([new LowercaseNormalizer()], []);

        const dataTransformerBuilder = new DataTransformerBuilder();
        dataTransformerBuilder
            .addAfterRowTransformInterceptor("first_interceptor")
            .add()
            .setSourceProperty("0")
            .setDestinationProperty("name")
            .end()

       await expect(dataTransformer.transform(dataTransformerBuilder, [{"0": "a"}])).rejects.toThrowError(DataTransformerInterceptorNotFoundError);
    })
    it("should throw properly when an element is not optional and not found in the source", async () => {
        const dataTransformer = new DataTransformer([new LowercaseNormalizer()], []);

        const dataTransformerBuilder = new DataTransformerBuilder();
        dataTransformerBuilder
            .add()
            .setSourceProperty("0")
            .setDestinationProperty("name")
            .end()

       await expect(dataTransformer.transform(dataTransformerBuilder, [{"a": "a"}])).rejects.toThrowError(DataTransformerSourcePropertyNotFoundError);
    })
});