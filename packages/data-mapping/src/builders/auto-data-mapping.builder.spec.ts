import "reflect-metadata"
import {AutoDataMappingBuilder} from "./auto-data-mapping.builder";
import {classMetadata, property, array} from "@pristine-ts/metadata";
import {DataMapper} from "../mappers/data.mapper";
import {StringNormalizer} from "../normalizers/string.normalizer";
import {NumberNormalizer} from "../normalizers/number.normalizer";
import {DateNormalizer} from "../normalizers/date.normalizer";
import {typeFactory} from "../decorators/type-factory.decorator";

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

        const dataMapper = new DataMapper(new AutoDataMappingBuilder(), [new StringNormalizer(), new NumberNormalizer(), new DateNormalizer()], []);

        const mapped = await dataMapper.map(dataMappingBuilder, source, Source);

        const a = 0;
    })

    it("should accept that a property is nullable and might not be included", () => {
    })
})