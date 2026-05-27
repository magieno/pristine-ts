/**
 * Tests for the fluent sugar API on DataMappingBuilder / DataMappingNode.
 *
 * These methods (`field`, `nested`, `arrayOfObjects`, `arrayOfScalars`) are additive over the
 * low-level chain (`.add().setSourceProperty().setDestinationProperty().end()`). They share
 * the same underlying nodes, so we assert behavior equivalence against the verbose chain.
 */
import "reflect-metadata";
import {DataMappingBuilder} from "./data-mapping.builder";
import {DataMapper} from "../mappers/data.mapper";
import {AutoDataMappingBuilder} from "./auto-data-mapping.builder";
import {LowercaseNormalizer, LowercaseNormalizerUniqueKey} from "../normalizers/lowercase.normalizer";
import {StringNormalizer, StringNormalizerUniqueKey} from "../normalizers/string.normalizer";
import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {DataMappingLeaf} from "../nodes/data-mapping.leaf";
import {DataMappingNode} from "../nodes/data-mapping.node";
import {DataMappingSourcePropertyNotFoundError} from "../errors/data-mapping-source-property-not-found.error";
import {UndefinedDestinationPropertyError} from "../errors/undefined-destination-property.error";

describe("DataMappingBuilder — fluent API", () => {

  describe("field()", () => {
    it("should build a leaf with both source and destination set when both args are passed", () => {
      const builder = new DataMappingBuilder();
      builder.field("title", "name");

      const leaf = builder.nodes.title as DataMappingLeaf;
      expect(leaf).toBeInstanceOf(DataMappingLeaf);
      expect(leaf.sourceProperty).toBe("title");
      expect(leaf.destinationProperty).toBe("name");
      expect(leaf.type).toBe(DataMappingNodeTypeEnum.Leaf);
    });

    it("should default destination to source when only one arg is passed", () => {
      const builder = new DataMappingBuilder();
      builder.field("status");

      const leaf = builder.nodes.status as DataMappingLeaf;
      expect(leaf.sourceProperty).toBe("status");
      expect(leaf.destinationProperty).toBe("status");
    });

    it("should apply normalizers from options (shorthand string form)", () => {
      const builder = new DataMappingBuilder();
      builder.field("title", "name", {normalizers: [LowercaseNormalizerUniqueKey]});

      const leaf = builder.nodes.title as DataMappingLeaf;
      expect(leaf.normalizers).toHaveLength(1);
      expect(leaf.normalizers[0].key).toBe(LowercaseNormalizerUniqueKey);
      expect(leaf.normalizers[0].options).toBeUndefined();
    });

    it("should apply normalizers from options ({key, options} form)", () => {
      const builder = new DataMappingBuilder();
      builder.field("title", "name", {
        normalizers: [{key: LowercaseNormalizerUniqueKey, options: {shouldThrowIfTypeIsNotString: true}}],
      });

      const leaf = builder.nodes.title as DataMappingLeaf;
      expect(leaf.normalizers).toHaveLength(1);
      expect(leaf.normalizers[0].key).toBe(LowercaseNormalizerUniqueKey);
      expect(leaf.normalizers[0].options).toEqual({shouldThrowIfTypeIsNotString: true});
    });

    it("should apply isOptional and excludeNormalizers from options", () => {
      const builder = new DataMappingBuilder();
      builder
        .addNormalizer(LowercaseNormalizerUniqueKey)
        .field("password", "password", {
          isOptional: true,
          excludeNormalizers: [LowercaseNormalizerUniqueKey],
        });

      const leaf = builder.nodes.password as DataMappingLeaf;
      expect(leaf.isOptional).toBe(true);
      expect(leaf.excludedNormalizers.has(LowercaseNormalizerUniqueKey)).toBe(true);
    });

    it("should chain — each field call returns the builder", () => {
      const builder = new DataMappingBuilder();
      const result = builder
        .field("a")
        .field("b", "renamedB")
        .field("c");

      expect(result).toBe(builder);
      expect(Object.keys(builder.nodes)).toEqual(["a", "b", "c"]);
    });

    it("should validate destinationProperty via the existing addNode guard if explicitly cleared", () => {
      // Sanity: the fluent API can't *avoid* the validation. Verified via the existing
      // UndefinedDestinationPropertyError path — sugar always sets destination, so this is
      // exercised by the .add() / .setSourceProperty(...) / .end() flow without a destination.
      const builder = new DataMappingBuilder();
      expect(() => {
        builder.add().setSourceProperty("title").end();
      }).toThrow(UndefinedDestinationPropertyError);
    });
  });

  describe("nested()", () => {
    it("should build a nested node and configure children via the build callback", () => {
      const builder = new DataMappingBuilder();
      builder.nested("nested", "child", (child) => {
        child.field("nestedTitle", "nestedName");
        child.field("nestedRank", "nestedPosition");
      });

      const node = builder.nodes.nested as DataMappingNode;
      expect(node).toBeInstanceOf(DataMappingNode);
      expect(node.sourceProperty).toBe("nested");
      expect(node.destinationProperty).toBe("child");
      expect(node.type).toBe(DataMappingNodeTypeEnum.Node);
      expect(Object.keys(node.nodes)).toEqual(["nestedTitle", "nestedRank"]);
      expect(node.nodes.nestedTitle.destinationProperty).toBe("nestedName");
    });

    it("should support deep nesting via recursive callbacks", () => {
      const builder = new DataMappingBuilder();
      builder.nested("a", "a", (n1) => {
        n1.nested("b", "b", (n2) => {
          n2.nested("c", "c", (n3) => {
            n3.field("leaf", "leaf");
          });
        });
      });

      const level1 = builder.nodes.a as DataMappingNode;
      const level2 = level1.nodes.b as DataMappingNode;
      const level3 = level2.nodes.c as DataMappingNode;
      expect(level3.nodes.leaf).toBeInstanceOf(DataMappingLeaf);
    });

    it("should apply isOptional and destinationType from options", () => {
      class Child {}
      const builder = new DataMappingBuilder();
      builder.nested("nested", "child", () => {}, {isOptional: true, destinationType: Child});

      const node = builder.nodes.nested as DataMappingNode;
      expect(node.isOptional).toBe(true);
      expect(node.destinationType).toBe(Child);
    });
  });

  describe("arrayOfObjects()", () => {
    it("should build an array-of-objects node with per-element schema from the callback", () => {
      const builder = new DataMappingBuilder();
      builder.arrayOfObjects("items", "list", (element) => {
        element.field("rank", "position");
      });

      const node = builder.nodes.items as DataMappingNode;
      expect(node.type).toBe(DataMappingNodeTypeEnum.ObjectArray);
      expect(node.sourceProperty).toBe("items");
      expect(node.destinationProperty).toBe("list");
      expect((node.nodes.rank as DataMappingLeaf).destinationProperty).toBe("position");
    });

    it("should accept a factory callback as destinationType for polymorphic arrays", () => {
      class A {}
      class B {}
      const factory = (target: any, propertyKey: string, index: number) => {
        return index === 0 ? new A() : new B();
      };

      const builder = new DataMappingBuilder();
      builder.arrayOfObjects("items", "items", () => {}, {destinationType: factory});

      const node = builder.nodes.items as DataMappingNode;
      expect(node.destinationType).toBe(factory);
    });
  });

  describe("arrayOfScalars()", () => {
    it("should build a ScalarArray leaf and apply normalizers per element", () => {
      const builder = new DataMappingBuilder();
      builder.arrayOfScalars("children", "infants", {normalizers: [LowercaseNormalizerUniqueKey]});

      const leaf = builder.nodes.children as DataMappingLeaf;
      expect(leaf.type).toBe(DataMappingNodeTypeEnum.ScalarArray);
      expect(leaf.destinationProperty).toBe("infants");
      expect(leaf.normalizers[0].key).toBe(LowercaseNormalizerUniqueKey);
    });

    it("should default destination to source when only one arg is passed", () => {
      const builder = new DataMappingBuilder();
      builder.arrayOfScalars("tags");

      const leaf = builder.nodes.tags as DataMappingLeaf;
      expect(leaf.sourceProperty).toBe("tags");
      expect(leaf.destinationProperty).toBe("tags");
    });
  });

  describe("equivalence with the low-level chain", () => {
    it("should produce identical mapping output for the same schema expressed both ways", async () => {
      class Source {
        title: string;
        nested: { nestedTitle: string };
        array: Array<{rank: number}>;
        children: string[];
      }

      class NestedDest {
        nestedName: string;
      }

      class ArrayDest {
        position: number;
      }

      class Destination {
        name: string;
        child: NestedDest;
        list: ArrayDest[];
        infants: string[];
      }

      const source: Source = {
        title: "TITLE",
        nested: {nestedTitle: "NESTED"},
        array: [{rank: 1}, {rank: 2}],
        children: ["A", "B"],
      };

      // Low-level chain version
      const verboseBuilder = new DataMappingBuilder();
      verboseBuilder
        .add().setSourceProperty("title").setDestinationProperty("name").addNormalizer(LowercaseNormalizerUniqueKey).end()
        .addNestingLevel().setSourceProperty("nested").setDestinationProperty("child").setDestinationType(NestedDest)
          .add().setSourceProperty("nestedTitle").setDestinationProperty("nestedName").addNormalizer(LowercaseNormalizerUniqueKey).end()
        .end()
        .addArrayOfObjects().setSourceProperty("array").setDestinationProperty("list").setDestinationType(ArrayDest)
          .add().setSourceProperty("rank").setDestinationProperty("position").end()
        .end()
        .addArrayOfScalar().setSourceProperty("children").setDestinationProperty("infants").addNormalizer(LowercaseNormalizerUniqueKey).end();

      // Fluent sugar version — same schema, fewer characters
      const fluentBuilder = new DataMappingBuilder();
      fluentBuilder
        .field("title", "name", {normalizers: [LowercaseNormalizerUniqueKey]})
        .nested("nested", "child",
          child => child.field("nestedTitle", "nestedName", {normalizers: [LowercaseNormalizerUniqueKey]}),
          {destinationType: NestedDest},
        )
        .arrayOfObjects("array", "list",
          element => element.field("rank", "position"),
          {destinationType: ArrayDest},
        )
        .arrayOfScalars("children", "infants", {normalizers: [LowercaseNormalizerUniqueKey]});

      const dataMapper = new DataMapper(new AutoDataMappingBuilder(), [new LowercaseNormalizer(), new StringNormalizer()], []);

      const fromVerbose = await dataMapper.map(verboseBuilder, source, Destination);
      const fromFluent = await dataMapper.map(fluentBuilder, source, Destination);

      // Structural equality between the two outputs.
      expect(fromFluent).toEqual(fromVerbose);

      // Spot-check the actual values to prove the mapping really happened.
      expect(fromFluent.name).toBe("title");
      expect(fromFluent.child).toBeInstanceOf(NestedDest);
      expect(fromFluent.child.nestedName).toBe("nested");
      expect(fromFluent.list).toHaveLength(2);
      expect(fromFluent.list[0]).toBeInstanceOf(ArrayDest);
      expect(fromFluent.list[0].position).toBe(1);
      expect(fromFluent.infants).toEqual(["a", "b"]);
    });

    it("should respect isOptional in fluent calls the same way as the chain", async () => {
      const builder = new DataMappingBuilder();
      builder.field("missing", "missing", {isOptional: true});

      const dataMapper = new DataMapper(new AutoDataMappingBuilder(), [], []);
      await expect(dataMapper.map(builder, {})).resolves.toEqual({});

      // Without isOptional, the same missing source throws.
      const strictBuilder = new DataMappingBuilder();
      strictBuilder.field("missing", "missing");
      await expect(dataMapper.map(strictBuilder, {})).rejects.toThrow(DataMappingSourcePropertyNotFoundError);
    });
  });

  describe("usable inside nested callbacks too", () => {
    it("should expose all four sugar methods on the inner DataMappingNode", () => {
      const builder = new DataMappingBuilder();
      builder.nested("parent", "parent", (parent) => {
        parent
          .field("scalar", "scalar")
          .arrayOfScalars("tags", "tags")
          .nested("child", "child", (child) => child.field("leaf", "leaf"))
          .arrayOfObjects("items", "items", (item) => item.field("id", "id"));
      });

      const parent = builder.nodes.parent as DataMappingNode;
      expect(Object.keys(parent.nodes).sort()).toEqual(["child", "items", "scalar", "tags"]);
      expect(parent.nodes.scalar).toBeInstanceOf(DataMappingLeaf);
      expect(parent.nodes.tags.type).toBe(DataMappingNodeTypeEnum.ScalarArray);
      expect(parent.nodes.child).toBeInstanceOf(DataMappingNode);
      expect(parent.nodes.items.type).toBe(DataMappingNodeTypeEnum.ObjectArray);
    });
  });
});
