import "reflect-metadata";
import "jest-extended";
import {property} from "@pristine-ts/metadata";
import {DataMapper} from "../mappers/data.mapper";
import {AutoDataMappingBuilder} from "../builders/auto-data-mapping.builder";
import {DataMappingBuilder} from "../builders/data-mapping.builder";
import {AutoDataMappingBuilderOptions} from "../options/auto-data-mapping-builder.options";
import {StringNormalizer, StringNormalizerUniqueKey} from "../normalizers/string.normalizer";
import {NumberNormalizer} from "../normalizers/number.normalizer";
import {BooleanNormalizer} from "../normalizers/boolean.normalizer";
import {DateNormalizer} from "../normalizers/date.normalizer";
import {array} from "../decorators/array.decorator";

/**
 * `null` and `undefined` mean different things to the mapper:
 *
 *   - `undefined` / missing key: the source says nothing about the property. The node skips it
 *     and the destination keeps its class default.
 *   - `null`: the source says the property exists and is empty (SQL NULL, JSON null, DynamoDB
 *     NULL). The node must write `null` through so a cleared value is not confused with a
 *     never-set one.
 *
 * These specs pin the nested-object (`DataMappingNode`) behaviour for both. The leaf already
 * passes `null` to its normalizers; the object node used to crash on `Object.keys(null)`.
 */
describe("Data Mapping Node", () => {
  interface WebPushSubscriptionInterface {
    endpoint: string;
  }

  class Device {
    @property()
    id: string;

    // Runtime type (design:type) is `Object`, so the auto builder creates a DataMappingNode.
    @property()
    webPushSubscription?: WebPushSubscriptionInterface;
  }

  const createDataMapper = () => new DataMapper(
    new AutoDataMappingBuilder(),
    [new StringNormalizer(), new NumberNormalizer(), new BooleanNormalizer(), new DateNormalizer()],
    [],
  );

  describe("nested object with a null source", () => {
    it("should write null to the destination and return an instance of the class (throwOnErrors: true)", async () => {
      const dataMapper = createDataMapper();

      const mapped = await dataMapper.autoMap(
        {id: "ios-device", webPushSubscription: null},
        Device,
        new AutoDataMappingBuilderOptions({throwOnErrors: true}),
      );

      expect(mapped).toBeInstanceOf(Device);
      expect(mapped.id).toBe("ios-device");
      expect(mapped.webPushSubscription).toBeNull();
      expect(mapped.hasOwnProperty("webPushSubscription")).toBeTrue();
    });

    it("should not swallow an error and return the raw source when throwOnErrors is unset (the MysqlClient path)", async () => {
      const dataMapper = createDataMapper();

      const mapped = await dataMapper.autoMap(
        [{id: "ios-device", webPushSubscription: null}],
        Device,
        new AutoDataMappingBuilderOptions({isOptionalDefaultValue: true, excludeExtraneousValues: false, logErrors: false}),
      );

      expect(mapped).toHaveLength(1);
      expect(mapped[0]).toBeInstanceOf(Device);
      expect(mapped[0].webPushSubscription).toBeNull();
    });

    it("should write null through a manually built nesting level without running its sub-nodes", async () => {
      class NestedDestination {
        nestedName: string;
      }

      class Destination {
        child: NestedDestination;
      }

      const builder = new DataMappingBuilder();
      builder
        .addNestingLevel()
        .setSourceProperty("nested")
        .setDestinationProperty("child")
        .setDestinationType(NestedDestination)
        .add()
        .setSourceProperty("nestedTitle")
        .setDestinationProperty("nestedName")
        .end()
        .end();

      const dataMapper = createDataMapper();

      const mapped = await dataMapper.map(builder, {nested: null}, Destination);

      expect(mapped).toBeInstanceOf(Destination);
      expect(mapped.child).toBeNull();
    });
  });

  describe("nested object with an undefined source", () => {
    it("should leave the destination property undefined when the key is missing from the source", async () => {
      const dataMapper = createDataMapper();

      const mapped = await dataMapper.autoMap(
        {id: "ios-device"},
        Device,
        new AutoDataMappingBuilderOptions({throwOnErrors: true}),
      );

      expect(mapped).toBeInstanceOf(Device);
      expect(mapped.webPushSubscription).toBeUndefined();
      expect(mapped.hasOwnProperty("webPushSubscription")).toBeFalse();
    });

    it("should leave the destination property undefined when the source value is undefined", async () => {
      const dataMapper = createDataMapper();

      const mapped = await dataMapper.autoMap(
        {id: "ios-device", webPushSubscription: undefined},
        Device,
        new AutoDataMappingBuilderOptions({throwOnErrors: true}),
      );

      expect(mapped).toBeInstanceOf(Device);
      expect(mapped.webPushSubscription).toBeUndefined();
    });
  });

  describe("array of objects with a null element", () => {
    class Item {
      @property()
      name: string;
    }

    class Basket {
      @array(Item)
      @property()
      items: Item[];
    }

    it("should yield [null, instance] when auto mapped from [null, {...}]", async () => {
      const dataMapper = createDataMapper();

      const mapped = await dataMapper.autoMap(
        {items: [null, {name: "apple"}]},
        Basket,
        new AutoDataMappingBuilderOptions({throwOnErrors: true}),
      );

      expect(mapped).toBeInstanceOf(Basket);
      expect(mapped.items).toHaveLength(2);
      expect(mapped.items[0]).toBeNull();
      expect(mapped.items[1]).toBeInstanceOf(Item);
      expect(mapped.items[1].name).toBe("apple");
    });

    it("should yield [null, instance] through a manually built array of objects with sub-nodes", async () => {
      class ItemDestination {
        label: string;
      }

      class BasketDestination {
        list: ItemDestination[];
      }

      const builder = new DataMappingBuilder();
      builder
        .addArrayOfObjects()
        .setSourceProperty("items")
        .setDestinationProperty("list")
        .setDestinationType(ItemDestination)
        .add()
        .setSourceProperty("name")
        .setDestinationProperty("label")
        .end()
        .end();

      const dataMapper = createDataMapper();

      const mapped = await dataMapper.map(builder, {items: [null, {name: "apple"}]}, BasketDestination);

      expect(mapped).toBeInstanceOf(BasketDestination);
      expect(mapped.list).toHaveLength(2);
      expect(mapped.list[0]).toBeNull();
      expect(mapped.list[1]).toBeInstanceOf(ItemDestination);
      expect(mapped.list[1].label).toBe("apple");
    });
  });

  describe("leaf with a null source", () => {
    it("should keep passing null to the leaf normalizers (existing behaviour)", async () => {
      class Destination {
        name: string;
      }

      const builder = new DataMappingBuilder();
      builder
        .add()
        .setSourceProperty("title")
        .setDestinationProperty("name")
        .addNormalizer(StringNormalizerUniqueKey)
        .end();

      const dataMapper = createDataMapper();

      const mapped = await dataMapper.map(builder, {title: null}, Destination);

      // The StringNormalizer returns undefined for null; the leaf writes whatever the
      // normalizer chain produces. This spec only pins that a null leaf does not throw and
      // that the destination key is written.
      expect(mapped).toBeInstanceOf(Destination);
      expect(mapped.hasOwnProperty("name")).toBeTrue();
      expect(mapped.name).toBe(new StringNormalizer().normalize(null));
    });

    it("should map a null scalar column through autoMap without error", async () => {
      class Row {
        @property()
        id: string;

        @property()
        deletedAt?: Date;
      }

      const dataMapper = createDataMapper();

      const mapped = await dataMapper.autoMap(
        {id: "row-1", deletedAt: null},
        Row,
        new AutoDataMappingBuilderOptions({throwOnErrors: true}),
      );

      expect(mapped).toBeInstanceOf(Row);
      expect(mapped.id).toBe("row-1");
      expect(mapped.deletedAt).toBe(new DateNormalizer().normalize(null));
    });
  });
});
