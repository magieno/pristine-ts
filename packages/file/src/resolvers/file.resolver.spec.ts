import {FileResolver} from "./file.resolver";
import {
    AutoDataMappingBuilder,
    DataMapper,
    DateNormalizer,
    NumberNormalizer,
    StringNormalizer
} from "@pristine-ts/data-mapping-common";
import {IsNumber, IsString, validateNested, Validator} from "@pristine-ts/class-validator";
import {property} from "@pristine-ts/metadata";
import {ConfigurationResolverError} from "../../../configuration/src/errors/configuration-resolver.error";

describe("FileResolver", () => {
    const dataMapper = new DataMapper(new AutoDataMappingBuilder(), [new StringNormalizer(), new NumberNormalizer(), new DateNormalizer()], []);

    class NestedConfig {
        @IsString()
        name: string;

        @IsNumber()
        nestingLevel: number;
    }

    class ConfigTest {
        @IsString()
        title: string;

        @IsNumber()
        index: number;

        @validateNested()
        nested: NestedConfig
    }

    it("should properly resolve the options from a test config file", async () => {
        const fileResolver = new FileResolver(dataMapper, new Validator(), {
            filename: "./test-files/valid-config-test.json",
            classType: ConfigTest
        })

        const options = await fileResolver.resolve();

        expect(options).toBeInstanceOf(ConfigTest)
        expect(options.title).toEqual("Test Config")
        expect(options.index).toEqual(1)
        expect(options.nested).toBeInstanceOf(NestedConfig)
        expect(options.nested.name).toEqual("Nested Config")
        expect(options.nested.nestingLevel).toEqual(2)
    })

    it("should throw an error if the file doesn't exist", async () => {
        const filename = "./test-files/not-found.json";
        const fileResolver = new FileResolver(dataMapper, new Validator(), {
            filename,
            classType: ConfigTest
        })

        expect(fileResolver.resolve()).rejects.toThrow();//new ConfigurationResolverError("The file doesn't exist.", filename));
    })

    it("should throw if the configuration is invalid", async () => {
        const fileResolver = new FileResolver(dataMapper, new Validator(), {
            filename: "./test-files/invalid-config-test.json",
            classType: ConfigTest
        })

        expect(fileResolver.resolve()).rejects.toThrow();//new ConfigurationResolverError("The file doesn't exist.", filename));
    })
});