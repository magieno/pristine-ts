import {LowercaseNormalizer} from "../normalizers/lowercase.normalizer";
import {DataMappingInterceptorInterface} from "../interfaces/data-mapping-interceptor.interface";
import {DataMappingInterceptorUniqueKeyType} from "../types/data-mapping-interceptor-unique-key.type";
import {DataMappingInterceptorNotFoundError} from "../errors/data-mapping-interceptor-not-found.error";
import {DataMappingSourcePropertyNotFoundError} from "../errors/data-mapping-source-property-not-found.error";
import {property} from "@pristine-ts/metadata";
import "jest-extended"
import {DataMappingBuilder} from "../builders/data-mapping.builder";
import {DataMapper} from "./data.mapper";
import {Type} from "class-transformer";
import {AutoDataMappingBuilder} from "../builders/auto-data-mapping.builder";

describe("Data Mapper", () =>{
    it("should map a very complex object into another complex object. Then, it should export the builder, import the builder and make sure it still maps everything properly.", async () => {
        class ArraySource {
            rank: number;
        }

        class NestedSource {
            nestedTitle: string;
        }

        class Source {
            title: string;

            nested: NestedSource;

            array: ArraySource[] = [];

            children: string[] = [];
        }

        class ArrayDestination {
            position: number;
        }

        class NestedDestination {
            nestedName: string;
        }

        class Destination {
            name: string;

            @Type(() => NestedDestination)
            child: NestedDestination;

            @Type(() => ArrayDestination)
            list: ArrayDestination[];

            infants: string[] = []
        }

        let dataMappingBuilder = new DataMappingBuilder();

        dataMappingBuilder
            .addNormalizer(LowercaseNormalizer.name)
            .add()
                .setSourceProperty("title")
                .setDestinationProperty("name")
                .excludeNormalizer(LowercaseNormalizer.name)
            .end()
            .addNestingLevel()
                .setSourceProperty("nested")
                .setDestinationProperty("child")
                .add()
                    .setSourceProperty("nestedTitle")
                    .setDestinationProperty("nestedName")
                .end()
            .end()
            .addArrayOfObjects()
                .setSourceProperty("array")
                .setDestinationProperty("list")
                .add()
                    .setSourceProperty("rank")
                    .setDestinationProperty("position")
                .end()
            .end()
            .addArrayOfScalar()
                .setSourceProperty("children")
                .setDestinationProperty("infants")
            .end()
        .end();

        const source = new Source();
        source.title = "TITLE";
        source.children = ["Etienne", "Antoine", "Olivier"];
        source.nested = new NestedSource();
        source.nested.nestedTitle = "NESTED_TITLE";
        source.array = [];
        source.array[0] = new ArraySource()
        source.array[0].rank = 1
        source.array[1] = new ArraySource()
        source.array[1].rank = 2


        let dataMapper = new DataMapper(new AutoDataMappingBuilder(), [new LowercaseNormalizer()], []);

        const destination: Destination = await dataMapper.map(dataMappingBuilder, source, Destination);

        // Check that the mapping was properly done.
        expect(destination instanceof Destination).toBeTruthy();

        expect(destination.name).toBe("TITLE");
        expect(destination.infants.length).toBe(3);
        expect(destination.infants[0]).toBe("etienne")
        expect(destination.infants[1]).toBe("antoine")
        expect(destination.infants[2]).toBe("olivier")
        expect(destination.child).toBeDefined()
        expect(destination.child instanceof NestedDestination).toBeTruthy();
        expect(destination.child.nestedName).toBe("nested_title")
        expect(destination.list).toBeDefined()
        expect(destination.list.length).toBe(2)
        expect(destination.list[0] instanceof ArrayDestination).toBeTruthy()
        expect(destination.list[0].position).toBe(1)
        expect(destination.list[1] instanceof ArrayDestination).toBeTruthy()
        expect(destination.list[1].position).toBe(2)

        // Make sure that the import and export work and still map properly
        const schema = dataMappingBuilder.export();

        dataMapper = new DataMapper(new AutoDataMappingBuilder(), [new LowercaseNormalizer()], []);
        dataMappingBuilder = new DataMappingBuilder();
        dataMappingBuilder.import(schema);

        const destinationAfterExportAndReimport = await dataMapper.map(dataMappingBuilder, source, Destination);

        // Check AGAIN that the mapping was properly done.
        expect(destinationAfterExportAndReimport instanceof Destination).toBeTruthy();

        expect(destinationAfterExportAndReimport.name).toBe("TITLE");
        expect(destinationAfterExportAndReimport.infants.length).toBe(3);
        expect(destinationAfterExportAndReimport.infants[0]).toBe("etienne")
        expect(destinationAfterExportAndReimport.infants[1]).toBe("antoine")
        expect(destinationAfterExportAndReimport.infants[2]).toBe("olivier")
        expect(destinationAfterExportAndReimport.child).toBeDefined()
        expect(destinationAfterExportAndReimport.child instanceof NestedDestination).toBeTruthy();
        expect(destinationAfterExportAndReimport.child).toBeInstanceOf(NestedDestination);
        expect(destinationAfterExportAndReimport.child.nestedName).toBe("nested_title")
        expect(destinationAfterExportAndReimport.list).toBeDefined()
        expect(destinationAfterExportAndReimport.list.length).toBe(2)
        expect(destinationAfterExportAndReimport.list[0] instanceof ArrayDestination).toBeTruthy()
        expect(destinationAfterExportAndReimport.list[0].position).toBe(1)
        expect(destinationAfterExportAndReimport.list[1] instanceof ArrayDestination).toBeTruthy()
        expect(destinationAfterExportAndReimport.list[1].position).toBe(2)
    })

    it("should properly transform", async () => {
        const dataMapper = new DataMapper(new AutoDataMappingBuilder(), [new LowercaseNormalizer()], []);

        const source = [{
            NAME: "Etienne Noel",
            province: "QUEBEC",
            TOTAL: 10,
        }];

        const dataMappingBuilder = new DataMappingBuilder();
        dataMappingBuilder
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

        const destination = await dataMapper.mapAll(dataMappingBuilder, source);

        expect(destination.length).toBe(1)

        expect(destination[0].name).toBeDefined()
        expect(destination[0].name).toBe("Etienne Noel");
        expect(destination[0].province).toBe("quebec");
        expect(destination[0].total).toBe(10);
    })

    it("should properly transform an array with numerical indices", async () => {
        const dataMapper = new DataMapper(new AutoDataMappingBuilder(), [new LowercaseNormalizer()], []);

        const source = [
            ["Etienne Noel", "QUEBEC", 10],
        ];

        const dataMappingBuilder = new DataMappingBuilder();
        dataMappingBuilder
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

        const destination = await dataMapper.mapAll(dataMappingBuilder, source);

        expect(destination.length).toBe(1)

        expect(destination[0].name).toBeDefined()
        expect(destination[0].name).toBe("Etienne Noel");
        expect(destination[0].province).toBe("quebec");
        expect(destination[0].total).toBe(10);
    })

    it("should properly call the before row transformers and respect the order of calls", async () => {
        const firstInterceptor: DataMappingInterceptorInterface = {
            async beforeMapping(row: any): Promise<any> {
                return row;
            },
            async afterMapping(row: any): Promise<any> {
                return {
                    "after": row["name"] + row["province"] + row["total"] + row["added_property"],
                };
            },
            getUniqueKey(): DataMappingInterceptorUniqueKeyType {
                return "first_interceptor";
            },
        }
        const secondInterceptor: DataMappingInterceptorInterface = {
            async beforeMapping(row: any): Promise<any> {
                row[3] = "Property added in the beforeRowTransform";
                return row;
            },
            async afterMapping(row: any): Promise<any> {
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

        const dataTransformer = new DataMapper(new AutoDataMappingBuilder(), [new LowercaseNormalizer()], [
            firstInterceptor,
            secondInterceptor,
        ]);

        const source = [
            ["Etienne Noel", "QUEBEC", 10],
        ];

        const dataMappingBuilder = new DataMappingBuilder();
        dataMappingBuilder
            .addBeforeMappingInterceptor("first_interceptor")
            .addBeforeMappingInterceptor("second_interceptor")
            .addAfterMappingInterceptor("first_interceptor")
            .addAfterMappingInterceptor("second_interceptor")
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

        const mappedData: any[] = await dataTransformer.mapAll(dataMappingBuilder, source);

        expect(beforeRowFirstInterceptorSpy).toHaveBeenCalledBefore(beforeRowSecondInterceptorSpy);
        expect(beforeRowSecondInterceptorSpy).toHaveBeenCalledBefore(afterRowFirstInterceptorSpy)
        expect(afterRowFirstInterceptorSpy).toHaveBeenCalledBefore(afterRowSecondInterceptorSpy);

        expect(mappedData[0]["after"]).toBe("Etienne Noelquebec10Property added in the beforeRowTransform")
    })

    it("should throw properly when before row transformer cannot be found", async () => {
        const dataMapper = new DataMapper(new AutoDataMappingBuilder(), [new LowercaseNormalizer()], []);

        const dataMappingBuilder = new DataMappingBuilder();
        dataMappingBuilder
            .addBeforeMappingInterceptor("first_interceptor")
            .add()
                .setSourceProperty("0")
                .setDestinationProperty("name")
            .end()

        await expect(dataMapper.mapAll(dataMappingBuilder, [{"a": "a"}])).rejects.toThrowError(DataMappingInterceptorNotFoundError);
    })

    it("should throw properly when after row transformer cannot be found", async () => {
        const dataMapper = new DataMapper(new AutoDataMappingBuilder(), [new LowercaseNormalizer()], []);

        const dataMappingBuilder = new DataMappingBuilder();
        dataMappingBuilder
            .addAfterMappingInterceptor("first_interceptor")
            .add()
            .setSourceProperty("0")
            .setDestinationProperty("name")
            .end()

        await expect(dataMapper.mapAll(dataMappingBuilder, [{"0": "a"}])).rejects.toThrowError(DataMappingInterceptorNotFoundError);
    })

    it("should throw properly when an element is not optional and not found in the source", async () => {
         const dataMapper = new DataMapper(new AutoDataMappingBuilder(), [new LowercaseNormalizer()], []);

         const dataMappingBuilder = new DataMappingBuilder();
         dataMappingBuilder
             .add()
             .setSourceProperty("0")
             .setDestinationProperty("name")
             .end()

         await expect(dataMapper.mapAll(dataMappingBuilder, [{"a": "a"}])).rejects.toThrowError(DataMappingSourcePropertyNotFoundError);
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

        const dataMapper = new DataMapper(new AutoDataMappingBuilder(), [new LowercaseNormalizer()], []);

        const dataMappingBuilder = new DataMappingBuilder();
        dataMappingBuilder
            .add()
                .setSourceProperty("title")
                .setDestinationProperty("name")
                .addNormalizer(LowercaseNormalizer.name)
            .end()

        const destination = await dataMapper.map(dataMappingBuilder, source, Destination);

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

        const dataMapper = new DataMapper(new AutoDataMappingBuilder(), [new LowercaseNormalizer()], []);

        const dataMappingBuilder = new DataMappingBuilder();
        dataMappingBuilder
            .add()
                .setSourceProperty("title")
                .setDestinationProperty("name")
                .addNormalizer(LowercaseNormalizer.name)
            .end()

        const destination = await dataMapper.map(dataMappingBuilder, source, Destination);

        expect(destination.name).toBe("title");
    })

    it("should still automap an interface", async () => {
        interface SimpleInterface {
            name: string;
        }


        class Simpleclass {
            @property()
            simpleInterface: SimpleInterface
        }

        const dataMapper = new DataMapper(new AutoDataMappingBuilder(), [new LowercaseNormalizer()], []);

        const mapped = await dataMapper.autoMap({
            simpleInterface: {
                name: "InterfaceName"
            }
        }, Simpleclass)

        expect(mapped.simpleInterface).toBeDefined()
        expect(mapped.simpleInterface.name).toBe("InterfaceName")
    })

})