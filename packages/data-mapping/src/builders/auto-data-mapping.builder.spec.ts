import "reflect-metadata"
import {AutoDataMappingBuilder} from "./auto-data-mapping.builder";
import {classMetadata, property, array} from "@pristine-ts/metadata";
import {DataMapper} from "../mappers/data.mapper";
import {StringNormalizer} from "../normalizers/string.normalizer";
import {NumberNormalizer} from "../normalizers/number.normalizer";
import {DateNormalizer} from "../normalizers/date.normalizer";
import {typeFactory} from "../decorators/type-factory.decorator";
import {DataMappingNode} from "../nodes/data-mapping.node";
import {DataMappingLeaf} from "../nodes/data-mapping.leaf";
import {DataMappingBuilder} from "./data-mapping.builder";

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

            @typeFactory((target: any, propertyKey: string) => {
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
        expect(dataMappingBuilder.nodes["title"]).toBeInstanceOf(DataMappingLeaf);
        expect((dataMappingBuilder.nodes["title"] as DataMappingLeaf).normalizers).toHaveLength(1)
        expect((dataMappingBuilder.nodes["title"] as DataMappingLeaf).normalizers[0].key).toBe(StringNormalizer.name)

        expect(dataMappingBuilder.nodes["nested"]).toBeInstanceOf(DataMappingNode);
        expect(Object.keys((dataMappingBuilder.nodes["nested"] as DataMappingNode).nodes)).toHaveLength(2)
        expect((dataMappingBuilder.nodes["nested"] as DataMappingNode).nodes["nestedTitle"]).toBeInstanceOf(DataMappingLeaf);
        expect((dataMappingBuilder.nodes["nested"] as DataMappingNode).nodes["animal"]).toBeInstanceOf(DataMappingNode);
        expect(Object.keys(((dataMappingBuilder.nodes["nested"] as DataMappingNode).nodes["animal"] as DataMappingNode).nodes)).toHaveLength(2);
        expect(((dataMappingBuilder.nodes["nested"] as DataMappingNode).nodes["animal"] as DataMappingNode).nodes["friendly"]).toBeInstanceOf(DataMappingLeaf);
        expect(((dataMappingBuilder.nodes["nested"] as DataMappingNode).nodes["animal"] as DataMappingNode).nodes["head"]).toBeInstanceOf(DataMappingNode);
        expect(Object.keys((((dataMappingBuilder.nodes["nested"] as DataMappingNode).nodes["animal"] as DataMappingNode).nodes["head"] as DataMappingNode).nodes)).toHaveLength(1)
        expect((((dataMappingBuilder.nodes["nested"] as DataMappingNode).nodes["animal"] as DataMappingNode).nodes["head"] as DataMappingNode).nodes["name"]).toBeInstanceOf(DataMappingLeaf);
        expect(((((dataMappingBuilder.nodes["nested"] as DataMappingNode).nodes["animal"] as DataMappingNode).nodes["head"] as DataMappingNode).nodes["name"] as DataMappingLeaf).normalizers).toHaveLength(1)
        expect(((((dataMappingBuilder.nodes["nested"] as DataMappingNode).nodes["animal"] as DataMappingNode).nodes["head"] as DataMappingNode).nodes["name"] as DataMappingLeaf).normalizers[0].key).toBe(StringNormalizer.name)

        // todo COMPLETE THE VERIFICATION

        expect(dataMappingBuilder.nodes["date"]).toBeInstanceOf(DataMappingLeaf);
        expect(dataMappingBuilder.nodes["array"]).toBeInstanceOf(DataMappingNode);
        expect(dataMappingBuilder.nodes["children"]).toBeInstanceOf(DataMappingLeaf);

        const a = 0;
    })

    it("should accept that a property is nullable and might not be included", () => {
    })
})