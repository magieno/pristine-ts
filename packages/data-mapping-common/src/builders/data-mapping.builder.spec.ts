import {DataMappingBuilder} from "./data-mapping.builder";
import {LowercaseNormalizer} from "../normalizers/lowercase.normalizer";
import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {DataMappingNode} from "../nodes/data-mapping.node";
import {DataMappingLeaf} from "../nodes/data-mapping.leaf";

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

      child: NestedDestination;

      list: ArrayDestination[];

      infants: string[] = []
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

    expect(dataMappingBuilder.nodes.title).toBeDefined()
    expect(dataMappingBuilder.nodes.title.type).toBe(DataMappingNodeTypeEnum.Leaf)
    expect(dataMappingBuilder.nodes.title.destinationProperty).toBe("name")
    expect((dataMappingBuilder.nodes.title as DataMappingLeaf).excludedNormalizers.size).toBe(1)
    expect((dataMappingBuilder.nodes.title as DataMappingLeaf).excludedNormalizers.has(LowercaseNormalizer.name)).toBeTruthy()

    expect(dataMappingBuilder.nodes.nested).toBeDefined()
    expect(dataMappingBuilder.nodes.nested.type).toBe(DataMappingNodeTypeEnum.Node)
    expect(dataMappingBuilder.nodes.nested.destinationProperty).toBe("child")
    expect((dataMappingBuilder.nodes.nested as DataMappingNode).nodes.nestedTitle.sourceProperty).toBe("nestedTitle")
    expect((dataMappingBuilder.nodes.nested as DataMappingNode).nodes.nestedTitle.destinationProperty).toBe("nestedName")

    expect(dataMappingBuilder.nodes.array).toBeDefined()
    expect(dataMappingBuilder.nodes.array.type).toBe(DataMappingNodeTypeEnum.ObjectArray)
    expect(dataMappingBuilder.nodes.array.destinationProperty).toBe("list")
    expect((dataMappingBuilder.nodes.array as DataMappingNode).nodes.rank.sourceProperty).toBe("rank")
    expect((dataMappingBuilder.nodes.array as DataMappingNode).nodes.rank.destinationProperty).toBe("position")

    expect(dataMappingBuilder.nodes.children).toBeDefined()
    expect(dataMappingBuilder.nodes.children.type).toBe(DataMappingNodeTypeEnum.ScalarArray)
    expect(dataMappingBuilder.nodes.children.destinationProperty).toBe("infants")
    expect((dataMappingBuilder.nodes.children as DataMappingLeaf).sourceProperty).toBe("children")
    expect((dataMappingBuilder.nodes.children as DataMappingLeaf).destinationProperty).toBe("infants")

  })

  it("should properly set the parents", () => {
    class NestedSource2 {
      nestedTitle2: string;
    }

    class NestedSource {
      nested2: NestedSource2;
    }

    class Source {
      nested: NestedSource;
    }

    class NestedDestination2 {
      nestedTitle2: string;
    }

    class NestedDestination {
      nested2: NestedDestination2;
    }

    class Destination {
      nested: NestedDestination;
    }

    const dataMappingBuilder = new DataMappingBuilder();

    dataMappingBuilder
      .addNestingLevel()
      .setSourceProperty("nested")
      .setDestinationProperty("nested")
      .addNestingLevel()
      .setSourceProperty("nested2")
      .setDestinationProperty("nested2")
      .add()
      .setSourceProperty("nestedTitle2")
      .setDestinationProperty("nestedTitle2")
      .end()
      .end()
      .end()
      .end();

    expect((dataMappingBuilder.nodes.nested as DataMappingNode).nodes.nested2.sourceProperty).toBe("nested2");
    expect(((dataMappingBuilder.nodes.nested as DataMappingNode).nodes.nested2 as DataMappingNode).nodes.nestedTitle2.sourceProperty).toBe("nestedTitle2");

    expect((((dataMappingBuilder.nodes.nested as DataMappingNode).nodes.nested2 as DataMappingNode).parent as DataMappingNode).sourceProperty).toBe("nested");

    expect(((((dataMappingBuilder.nodes.nested as DataMappingNode).nodes.nested2 as DataMappingNode).nodes.nestedTitle2 as DataMappingLeaf).parent as DataMappingNode).sourceProperty).toBe("nested2");

  })
})