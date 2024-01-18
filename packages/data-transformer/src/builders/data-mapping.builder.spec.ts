import {DataMappingBuilder} from "./data-mapping.builder";
import {LowercaseNormalizer} from "../normalizers/lowercase.normalizer";
import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {DataMappingNode} from "../mapping-nodes/data-mapping.node";
import {DataMappingLeaf} from "../mapping-nodes/data-mapping.leaf";

describe("Data Mapping Builder", () => {
    it("should properly build a simple DataMappingBuilder", () => {
        class Source {
            title: string;

            rank: number;

            firstName: string;

            lastName: string;
        }

        class Destination {
            name: string;

            position: number;

            familyName: string;
        }

        const dataMappingBuilder = new DataMappingBuilder();

        dataMappingBuilder
            .add()
                .setSourceProperty("title")
                .setDestinationProperty("name")
                .excludeNormalizer(LowercaseNormalizer.name)
            .end()
            .add()
                .setSourceProperty("rank")
                .setDestinationProperty("position")
                .excludeNormalizer(LowercaseNormalizer.name)
            .end()
            .add()
                .setSourceProperty("lastName")
                .setDestinationProperty("familyName")
                .excludeNormalizer(LowercaseNormalizer.name)
            .end()
        .end()

        expect(dataMappingBuilder.nodes.title).toBeDefined()
        expect(dataMappingBuilder.nodes.title.type).toBe(DataMappingNodeTypeEnum.Leaf)
        expect(dataMappingBuilder.nodes.title.destinationProperty).toBe("name")
        expect((dataMappingBuilder.nodes.title as DataMappingLeaf).excludedNormalizers.size).toBe(1)
        expect((dataMappingBuilder.nodes.title as DataMappingLeaf).excludedNormalizers.has(LowercaseNormalizer.name)).toBeTruthy()

        expect(dataMappingBuilder.nodes.rank).toBeDefined()
        expect(dataMappingBuilder.nodes.rank.type).toBe(DataMappingNodeTypeEnum.Leaf)
        expect(dataMappingBuilder.nodes.rank.destinationProperty).toBe("position")
        expect((dataMappingBuilder.nodes.rank as DataMappingLeaf).excludedNormalizers.size).toBe(1)
        expect((dataMappingBuilder.nodes.rank as DataMappingLeaf).excludedNormalizers.has(LowercaseNormalizer.name)).toBeTruthy()

        expect(dataMappingBuilder.nodes.lastName).toBeDefined()
        expect(dataMappingBuilder.nodes.lastName.type).toBe(DataMappingNodeTypeEnum.Leaf)
        expect(dataMappingBuilder.nodes.lastName.destinationProperty).toBe("familyName")
        expect((dataMappingBuilder.nodes.lastName as DataMappingLeaf).excludedNormalizers.size).toBe(1)
        expect((dataMappingBuilder.nodes.lastName as DataMappingLeaf).excludedNormalizers.has(LowercaseNormalizer.name)).toBeTruthy()

        expect(dataMappingBuilder.nodes.firstName).toBeUndefined()
    })
    it("should properly build a complex DataMappingBuilder", () => {
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
        }

        class ArrayDestination {
            position: number;
        }

        class NestedDestination {
            nestedName: string;
        }

        class Destination {
            name: string;

            child: NestedDestination;

            list: ArrayDestination[];
        }

        const dataMappingBuilder = new DataMappingBuilder();

        dataMappingBuilder
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
            .addArray()
                .setSourceProperty("array")
                .setDestinationProperty("list")
                .add()
                    .setSourceProperty("rank")
                    .setDestinationProperty("position")
                .end()
            .end()
        .end();

        expect(dataMappingBuilder.nodes.title).toBeDefined()
        expect(dataMappingBuilder.nodes.title.type).toBe(DataMappingNodeTypeEnum.Leaf)
        expect(dataMappingBuilder.nodes.title.destinationProperty).toBe("name")
        expect((dataMappingBuilder.nodes.title as DataMappingLeaf).excludedNormalizers.size).toBe(1)
        expect((dataMappingBuilder.nodes.title as DataMappingLeaf).excludedNormalizers.has(LowercaseNormalizer.name)).toBeTruthy()


    })
})