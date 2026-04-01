import {FileResolver} from "./file.resolver";
import {
  AutoDataMappingBuilder,
  DataMapper,
  DateNormalizer,
  NumberNormalizer,
  StringNormalizer
} from "@pristine-ts/data-mapping-common";
import {IsNumber, IsString, validateNested, Validator} from "@pristine-ts/class-validator";

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
    const fileResolver = new FileResolver({
      filename: "./test-files/valid-config-test.json",
      classType: ConfigTest
    }, dataMapper, new Validator())

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
    const fileResolver = new FileResolver({
      filename,
      classType: ConfigTest
    }, dataMapper, new Validator())

    expect(fileResolver.resolve()).rejects.toThrow();
  })

  it("should throw if the configuration is invalid", async () => {
    const fileResolver = new FileResolver({
      filename: "./test-files/invalid-config-test.json",
      classType: ConfigTest
    }, dataMapper, new Validator(),)

    expect(fileResolver.resolve()).rejects.toThrow();
  })

  it("should throw if the content of the file is not valid JSON", async () => {
    const fileResolver = new FileResolver({
      filename: "./test-files/lorem_ipsum.txt",
      classType: ConfigTest
    }, dataMapper, new Validator(),)

    expect(fileResolver.resolve()).rejects.toThrow();
  })

  it("should still work if we don't pass a dataMapper", async () => {
    const fileResolver = new FileResolver({
      filename: "./test-files/valid-config-test.json",
      classType: ConfigTest
    }, undefined, new Validator())

    const options = await fileResolver.resolve();

    expect(options.title).toEqual("Test Config")
    expect(options.index).toEqual(1)
    expect(options.nested.name).toEqual("Nested Config")
    expect(options.nested.nestingLevel).toEqual(2)
  })

  it("should still work if we don't pass a validator", async () => {
    const fileResolver = new FileResolver({
      filename: "./test-files/valid-config-test.json",
      classType: ConfigTest
    }, dataMapper)

    const options = await fileResolver.resolve();

    expect(options).toBeInstanceOf(ConfigTest)
    expect(options.title).toEqual("Test Config")
    expect(options.index).toEqual(1)
    expect(options.nested).toBeInstanceOf(NestedConfig)
    expect(options.nested.name).toEqual("Nested Config")
    expect(options.nested.nestingLevel).toEqual(2)
  })
});
