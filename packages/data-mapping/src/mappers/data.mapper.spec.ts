import {DataTransformer} from "../transformers/data.transformer";
import {LowercaseNormalizer} from "../normalizers/lowercase.normalizer";
import {DataTransformerBuilder} from "../transformers/data-transformer.builder";
import {DataMappingInterceptorInterface} from "../interfaces/data-mapping-interceptor.interface";
import {DataTransformerRow} from "../types/data-transformer.row";
import {DataMappingInterceptorUniqueKeyType} from "../types/data-mapping-interceptor-unique-key.type";
import {DataTransformerInterceptorNotFoundError} from "../errors/data-transformer-interceptor-not-found.error";
import {DataTransformerSourcePropertyNotFoundError} from "../errors/data-transformer-source-property-not-found.error";
import {property} from "@pristine-ts/metadata";

describe("Data Mapper", () =>{
    it("should map a very complex object into another complex object. Then, it should export the builder, import the builder and make sure it still maps everything properly.", async () => {

    })

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
        const firstInterceptor: DataMappingInterceptorInterface = {
            async beforeMapping(row: DataTransformerRow): Promise<DataTransformerRow> {
                return row;
            },
            async afterMapping(row: DataTransformerRow): Promise<DataTransformerRow> {
                return {
                    "after": row["name"] + row["province"] + row["total"] + row["added_property"],
                };
            },
            getUniqueKey(): DataMappingInterceptorUniqueKeyType {
                return "first_interceptor";
            },
        }
        const secondInterceptor: DataMappingInterceptorInterface = {
            async beforeMapping(row: DataTransformerRow): Promise<DataTransformerRow> {
                row[3] = "Property added in the beforeRowTransform";
                return row;
            },
            async afterMapping(row: DataTransformerRow): Promise<DataTransformerRow> {
                return row;
            },
            getUniqueKey(): DataMappingInterceptorUniqueKeyType {
                return "second_interceptor";
            },
        }

        const beforeRowFirstInterceptorSpy = jest.spyOn(firstInterceptor, "beforeMapping")
        const afterRowFirstInterceptorSpy = jest.spyOn(firstInterceptor, "afterMapping")
        const beforeRowSecondInterceptorSpy = jest.spyOn(secondInterceptor, "beforeMapping")
        const afterRowSecondInterceptorSpy = jest.spyOn(secondInterceptor, "afterMapping")

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

    it("should properly type the return object when a destinationType is passed", async () => {
        class Source {
            @property()
            title: string;
        }

        class Destination {
            @property()
            name: string;
        }

        const source = new Source();
        source.title = "TITLE";

        const dataTransformer = new DataTransformer([new LowercaseNormalizer()], []);

        const dataTransformerBuilder = new DataTransformerBuilder();
        dataTransformerBuilder
            .add()
            .setSourceProperty("title")
            .setDestinationProperty("name")
            .addNormalizer(LowercaseNormalizer.name)
            .end()

        const destination = await dataTransformer.transform(dataTransformerBuilder, source, Destination);

        expect(destination.name).toBe("title");
    })


    it("should properly type the nested objects", async () => {
        class Source {
            @property()
            title: string;
        }

        class Destination {
            @property()
            name: string;
        }

        const source = new Source();
        source.title = "TITLE";

        const dataTransformer = new DataTransformer([new LowercaseNormalizer()], []);

        const dataTransformerBuilder = new DataTransformerBuilder();
        dataTransformerBuilder
            .add()
            .setSourceProperty("title")
            .setDestinationProperty("name")
            .addNormalizer(LowercaseNormalizer.name)
            .end()

        const destination = await dataTransformer.transform(dataTransformerBuilder, source, Destination);

        expect(destination.name).toBe("title");
    })
})