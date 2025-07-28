import {DataMappingLeaf} from "./data-mapping.leaf";
import {DataMappingBuilder} from "../builders/data-mapping.builder";
import {LowercaseNormalizer} from "../normalizers/lowercase.normalizer";
import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";

describe("Data Mapping Leaf", () => {
  it("should map the property corresponding to the leaf from the source to the destination while also applying the normalizers and excluding the specified normalizers", async () => {
    class Source {
      title: string = "TITLE";
    }

    class Destination {
      name: string;
    }

    class PrependUnderscoresNormalizer implements DataNormalizerInterface<string, {}> {
      getUniqueKey(): DataNormalizerUniqueKey {
        return PrependUnderscoresNormalizer.name;
      }

      normalize(source: any, options?: {}): string {
        return "__" + source;
      }
    }

    class AppendUnderscoresNormalizer implements DataNormalizerInterface<string, {}> {
      getUniqueKey(): DataNormalizerUniqueKey {
        return AppendUnderscoresNormalizer.name;
      }

      normalize(source: any, options?: {}): string {
        return source + "__";
      }
    }

    const dataBuilder = new DataMappingBuilder();
    dataBuilder.addNormalizer(PrependUnderscoresNormalizer.name);
    dataBuilder.addNormalizer(AppendUnderscoresNormalizer.name);

    const leaf = new DataMappingLeaf(dataBuilder, dataBuilder);
    leaf.setSourceProperty("title");
    leaf.setDestinationProperty("name");
    leaf.addNormalizer(LowercaseNormalizer.name)
    leaf.excludeNormalizer(PrependUnderscoresNormalizer.name)

    const destination = new Destination();

    await leaf.map(new Source(), destination, {
      [LowercaseNormalizer.name]: new LowercaseNormalizer(),
      [PrependUnderscoresNormalizer.name]: new PrependUnderscoresNormalizer(),
      [AppendUnderscoresNormalizer.name]: new AppendUnderscoresNormalizer(),
    });

    expect(destination.name).toBeDefined()
    expect(destination.name).toBe("title__");
  })

  it("should properly map an array of scalars", async () => {
    class Source {
      array: string[] = [
        "-4",
        "100",
        "9350",
        "5",
      ]
    }

    class Destination {
      name: number[] = [];
    }

    class ConvertToNumber implements DataNormalizerInterface<number, {}> {
      getUniqueKey(): DataNormalizerUniqueKey {
        return ConvertToNumber.name;
      }

      normalize(source: any, options?: {}): number {
        return parseInt(source);
      }
    }

    const dataBuilder = new DataMappingBuilder();
    dataBuilder.addNormalizer(ConvertToNumber.name);

    const leaf = new DataMappingLeaf(dataBuilder, dataBuilder, DataMappingNodeTypeEnum.ScalarArray);
    leaf.setSourceProperty("array");
    leaf.setDestinationProperty("name");

    const destination = new Destination();

    await leaf.map(new Source(), destination, {
      [ConvertToNumber.name]: new ConvertToNumber(),
    });

    expect(destination.name).toBeDefined()
    expect(Array.isArray(destination.name)).toBeTruthy()
    expect(destination.name.length).toBe(4);
    expect(destination.name[0]).toBe(-4);
    expect(destination.name[1]).toBe(100);
    expect(destination.name[2]).toBe(9350);
    expect(destination.name[3]).toBe(5);
  })
});