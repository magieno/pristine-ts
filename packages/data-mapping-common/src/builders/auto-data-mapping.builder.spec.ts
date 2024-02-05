import "reflect-metadata"
import {AutoDataMappingBuilder} from "./auto-data-mapping.builder";
import {classMetadata, property} from "@pristine-ts/metadata";
import {DataMapper} from "../mappers/data.mapper";
import {StringNormalizer} from "../normalizers/string.normalizer";
import {NumberNormalizer} from "../normalizers/number.normalizer";
import {DateNormalizer} from "../normalizers/date.normalizer";
import {type} from "../decorators/type.decorator";
import {DataMappingNode} from "../nodes/data-mapping.node";
import {DataMappingLeaf} from "../nodes/data-mapping.leaf";
import {DataMappingBuilder} from "./data-mapping.builder";
import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {array} from "../decorators/array.decorator";
import {AutoDataMappingBuilderOptions} from "../options/auto-data-mapping-builder.options";

describe("Auto DataMappingBuilder", () => {
    it("should automatically map a multi level nested object", async () => {
        @classMetadata()
        class DogHead {
            @property()
            name: string;
        }

        @classMetadata()
        abstract class Animal {
            @property()
            friendly: boolean;
        }

        @classMetadata()
        class Dog extends Animal {
            @property()
            head: DogHead;
        }

        @classMetadata()
        class Cat extends Animal {
            @property()
            isSmall: boolean;
        }

        @classMetadata()
        class ArraySource {
            @property()
            rank: number;
        }

        @classMetadata()
        class NestedSource {
            @property()
            nestedTitle: string;

            @type((target: any, propertyKey: string) => {
                if(target.nestedTitle === "cat") {
                    return new Cat();
                }

                return new Dog();
            })
            animal: Animal
        }

        @classMetadata()
        class Source {
            @property()
            title: string;

            @property()
            nested: NestedSource;

            @property()
            date: Date

            @array(ArraySource)
            array: ArraySource[] = [];

            @array(String)
            children: string[] = [];
        }

        const autoDataMappingBuilder = new AutoDataMappingBuilder();

        const source = {
            "title": "My title",
            "nested": {
                "nestedTitle": "My nested Title",
                "animal": {
                    "head": {
                        "name": "Peach",
                    },
                    "friendly": true,
                },
            },
            "date": "1990-12-19",
            "array": [
                {
                    rank: 0,
                },
                {
                    rank: 1,
                }
            ],
            "children": ["Thomas", "Jeanne"],
        };

        const dataMappingBuilder = autoDataMappingBuilder.build(source, Source);

        // Verify the `dataMappingBuilder`
        expect(dataMappingBuilder).toBeInstanceOf(DataMappingBuilder);
        expect(Object.keys(dataMappingBuilder.nodes)).toHaveLength(5)

        const titleLeaf = dataMappingBuilder.nodes["title"] as DataMappingLeaf;
        expect(titleLeaf).toBeInstanceOf(DataMappingLeaf);
        expect(titleLeaf.normalizers).toHaveLength(1)
        expect(titleLeaf.normalizers[0].key).toBe(StringNormalizer.name)

        const nestedNode = dataMappingBuilder.nodes["nested"] as DataMappingNode;
        expect(nestedNode).toBeInstanceOf(DataMappingNode);
        expect(Object.keys(nestedNode.nodes)).toHaveLength(2);

        const nestedTitleLeaf = nestedNode.nodes["nestedTitle"] as DataMappingLeaf;
        expect(nestedTitleLeaf).toBeInstanceOf(DataMappingLeaf);

        const animalNode = nestedNode.nodes["animal"] as DataMappingNode;
        expect(animalNode).toBeInstanceOf(DataMappingNode);
        expect(Object.keys(animalNode.nodes)).toHaveLength(3);

        const friendLeaf = animalNode.nodes["friendly"] as DataMappingLeaf;
        expect(friendLeaf).toBeInstanceOf(DataMappingLeaf);

        const headNode = animalNode.nodes["head"] as DataMappingNode;
        expect(headNode).toBeInstanceOf(DataMappingNode);
        expect(Object.keys(headNode.nodes)).toHaveLength(1)

        const nameLeaf = headNode.nodes["name"] as DataMappingLeaf;
        expect(nameLeaf).toBeInstanceOf(DataMappingLeaf);
        expect(nameLeaf.normalizers).toHaveLength(1)
        expect(nameLeaf.normalizers[0].key).toBe(StringNormalizer.name)

        const dateLeaf = dataMappingBuilder.nodes["date"] as DataMappingLeaf;
        expect(dateLeaf).toBeInstanceOf(DataMappingLeaf);
        expect(dateLeaf.normalizers).toHaveLength(1)
        expect(dateLeaf.normalizers[0].key).toBe(DateNormalizer.name);

        const arrayNode = dataMappingBuilder.nodes["array"] as DataMappingNode;
        expect(arrayNode).toBeInstanceOf(DataMappingNode);
        expect(arrayNode.type).toBe(DataMappingNodeTypeEnum.ObjectArray);

        const rankLeaf = arrayNode.nodes["rank"] as DataMappingLeaf;
        expect(rankLeaf).toBeInstanceOf(DataMappingLeaf);
        expect(rankLeaf.normalizers).toHaveLength(1)
        expect(rankLeaf.normalizers[0].key).toBe(NumberNormalizer.name);

        const childrenLeaf = dataMappingBuilder.nodes["children"] as DataMappingLeaf;
        expect(childrenLeaf).toBeInstanceOf(DataMappingLeaf);
        expect(childrenLeaf.type).toBe(DataMappingNodeTypeEnum.ScalarArray);
        expect(childrenLeaf.normalizers).toHaveLength(1)
        expect(childrenLeaf.normalizers[0].key).toBe(StringNormalizer.name);
    })
})