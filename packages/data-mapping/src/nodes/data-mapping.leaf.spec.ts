import {DataMappingLeaf} from "./data-mapping.leaf";
import {DataMappingBuilder} from "../builders/data-mapping.builder";
import {LowercaseNormalizer} from "../normalizers/lowercase.normalizer";
import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";

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
});