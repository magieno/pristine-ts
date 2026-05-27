import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {DataMappingLeaf} from "./data-mapping.leaf";
import {DataMappingBuilder} from "../builders/data-mapping.builder";
import {BaseDataMappingNode} from "./base-data-mapping.node";
import {DataMappingSourcePropertyNotFoundError} from "../errors/data-mapping-source-property-not-found.error";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";
import {ArrayDataMappingNodeInvalidSourcePropertyTypeError} from "../errors/array-data-mapping-node-invalid-source-property-type.error";
import {ClassConstructor, plainToInstance} from "class-transformer";
import {DataMapperOptions} from "../options/data-mapper.options";
import {ArrayMemberTypeFactoryCallbackType} from "../types/array-member-type-factory-callback.type";
import {DataMappingSerializer} from "../serializers/data-mapping.serializer";

export class DataMappingNode extends BaseDataMappingNode {
  /**
   * This property represents the property referenced in the `source` object.
   */
  public sourceProperty!: string;

  /**
   * This property represents the property referenced in the `destination` object.
   */
  public destinationProperty!: string;

  /**
   * This method specified whether it's possible that this element not be present in the `source` object.
   */
  public isOptional: boolean = false;

  /**
   * IMPORTANT: This property is not serializable. It will be lost during the export.
   */
  public destinationType?: ClassConstructor<any> | ArrayMemberTypeFactoryCallbackType;

  constructor(public readonly root: DataMappingBuilder,
              public readonly parent: DataMappingNode | DataMappingBuilder,
              public readonly type: DataMappingNodeTypeEnum = DataMappingNodeTypeEnum.Node,
  ) {
    super();
  }

  /**
   * This is a setter for `sourceProperty`.
   * @param sourceProperty
   */
  public setSourceProperty(sourceProperty: string): DataMappingNode {
    this.sourceProperty = sourceProperty;
    return this;
  }

  /**
   * This is a setter for `destinationProperty`.
   * @param destinationProperty
   */
  public setDestinationProperty(destinationProperty: string): DataMappingNode {
    this.destinationProperty = destinationProperty;
    return this;
  }

  /**
   * This is a setter for `destinationType`.
   * @param destinationType
   */
  public setDestinationType(destinationType: ClassConstructor<any> | ArrayMemberTypeFactoryCallbackType): DataMappingNode {
    this.destinationType = destinationType;
    return this;
  }

  /**
   * This is a setter for `isOptional`.
   * @param isOptional
   */
  public setIsOptional(isOptional: boolean): DataMappingNode {
    this.isOptional = isOptional;

    return this;
  }

  /**
   * This property creates a new DataMappingLeaf and returns it. It doesn't add it yet. To do so, the `end()` method
   * must be called.
   */
  public add() {
    return new DataMappingLeaf(this.root, this);
  }

  /**
   * This method adds a nesting level. This should be used when the property contains an object and you want to map
   * this object into another object.
   */
  public addNestingLevel() {
    return new DataMappingNode(this.root, this);
  }

  /**
   * This method adds an array of Scalar allowing you to apply the normalizer on each scalar in the array. The
   * `sourceProperty` and `destinationProperty` correspond to the name of the property that is an array. But, the
   * values in the array will be normalized using the normalizer.
   *
   */
  public addArrayOfScalar(): DataMappingLeaf {
    return new DataMappingLeaf(this.root, this, DataMappingNodeTypeEnum.ScalarArray);
  }

  /**
   * This method adds an array of objects allowing to define a node for each property in the object. Each object in
   * the array will be treated as being the same.
   */
  public addArrayOfObjects(): DataMappingNode {
    return new DataMappingNode(this.root, this, DataMappingNodeTypeEnum.ObjectArray);
  }

  /**
   * This method adds this node to its parent and returns the parent.
   */
  public end(): DataMappingNode | DataMappingBuilder {
    // todo: Validate that we actually have all the properties needed (sourceProperty and destinationProperty) for example.
    this.parent.addNode(this)

    return this.parent;
  }

  /**
   * This method maps the `sourceProperty` from the `source` object and maps it to the `destinationProperty` of the
   * `destination` object while applying the normalizers.
   *
   * @param source
   * @param destination
   * @param normalizersMap
   */
  public async map(source: any, destination: any, normalizersMap: { [key in DataNormalizerUniqueKey]: DataNormalizerInterface<any, any> }, options?: DataMapperOptions) {
    if (source.hasOwnProperty(this.sourceProperty) === false) {
      if (this.isOptional) {
        return
      }

      throw new DataMappingSourcePropertyNotFoundError("The property '" + this.sourceProperty + "' isn't found in the Source object and isn't marked as Optional. If you want to ignore this property, use the 'setIsOptional(true)' method in the builder.", this.sourceProperty)
    }

    const sourceElement = source[this.sourceProperty];

    if (sourceElement === undefined) {
      return;
    }

    // Whether source-keyed properties should be carried through to the destination.
    // When `excludeExtraneousValues === true`, only renamed destination keys (written by
    // sub-nodes below) end up on the destination — source keys are dropped.
    const includeSourceKeys = options?.excludeExtraneousValues === false;

    if (this.type === DataMappingNodeTypeEnum.ObjectArray) {
      // Array case: handled below in its own loop. Just pre-allocate the array here.
      destination[this.destinationProperty] = [];
    } else {
      // Single-object case: build the destination value once, then let sub-nodes overlay
      // renamed keys onto it.
      destination[this.destinationProperty] = this.buildDestinationObject(sourceElement, includeSourceKeys);
    }

    const destinationElement = destination[this.destinationProperty];

    if (this.type === DataMappingNodeTypeEnum.ObjectArray) {
      const sourceArray = source[this.sourceProperty];

      if (Array.isArray(sourceArray) === false) {
        throw new ArrayDataMappingNodeInvalidSourcePropertyTypeError(`According to your schema, the property '${this.sourceProperty}' in the source object must contain an Array of objects. Instead, it contains: '${typeof sourceArray}'.`, this.sourceProperty);
      }

      // For each source element: build the destination object (whose concrete class may
      // depend on the element index when `destinationType` is a factory callback), let the
      // sub-nodes overlay their renamed keys, then push.
      for (let index = 0; index < sourceArray.length; index++) {
        const element = sourceArray[index];
        const dest = this.buildArrayMemberDestination(source, element, index, includeSourceKeys);

        await this.runSubNodes(element, dest, normalizersMap, options);

        destinationElement.push(dest);
      }

      return;
    }

    // Single-object case: sub-nodes write into the destination we just built above.
    await this.runSubNodes(sourceElement, destinationElement, normalizersMap, options);
  }

  /**
   * Build the destination object for the single-object case.
   *
   * If a `destinationType` (class constructor) is set, instantiate the class. Otherwise return
   * a plain object. When `includeSourceKeys` is true, the source's own enumerable properties are
   * seeded onto the result so they survive the mapping; sub-nodes then overlay renamed keys on top.
   *
   * Note: the single-object case treats `destinationType` strictly as a class constructor.
   * Factory callbacks only make sense for the per-element ObjectArray case below.
   */
  private buildDestinationObject(sourceElement: any, includeSourceKeys: boolean): any {
    const seedFromSource = includeSourceKeys
      && sourceElement !== null
      && (typeof sourceElement === "object" || Array.isArray(sourceElement));

    if (this.destinationType !== undefined) {
      return plainToInstance(
        this.destinationType as ClassConstructor<any>,
        seedFromSource ? sourceElement : {},
      );
    }

    const result: any = {};
    if (seedFromSource) {
      Object.keys(sourceElement).forEach(property => {
        result[property] = sourceElement[property];
      });
    }
    return result;
  }

  /**
   * Build the destination object for a single element of an ObjectArray. Mirrors
   * `buildDestinationObject`, with two extra wrinkles unique to arrays:
   *
   *   1. `destinationType` can be a *factory callback* instead of a fixed class. The callback
   *      receives the source array's parent + the element's index and returns an instance of
   *      the concrete class to use. This is how polymorphic arrays work (e.g. some elements
   *      become `Cat`, others `Dog`).
   *   2. The seed value is the per-element object, not the whole array.
   */
  private buildArrayMemberDestination(source: any, element: any, index: number, includeSourceKeys: boolean): any {
    const seedFromSource = includeSourceKeys && element !== null && typeof element === "object";

    if (this.destinationType === undefined) {
      // Untyped array — produce a plain object, optionally seeded with the element's own keys.
      const result: any = {};
      if (seedFromSource) {
        Object.keys(element).forEach(property => {
          result[property] = element[property];
        });
      }
      return result;
    }

    const memberConstructor = this.resolveArrayMemberConstructor(source, index);
    return plainToInstance(memberConstructor, seedFromSource ? element : {});
  }

  /**
   * Resolve the concrete class constructor for a single element of an ObjectArray.
   *
   * `destinationType` here is one of two things:
   *
   *   - a **class constructor** (uniform array — every element maps to the same class), or
   *   - a **factory callback** of shape `(source, sourceProperty, index) => instance`
   *     (polymorphic array — class is chosen per element).
   *
   * JavaScript gives us no clean way to distinguish a class constructor from a callback —
   * both are `typeof === "function"`. The conventional discriminant: a class constructor has
   * a `.prototype` object (where its instance methods live); an arrow function does not.
   *
   * Caveat: a regular `function() { ... }` expression used as a callback would also have a
   * `.prototype` and would be mis-classified as a class. The public type only documents the
   * arrow-function form (`ArrayMemberTypeFactoryCallbackType = (...) => any`), and in practice
   * callers use arrow functions, so this is safe for documented usage.
   */
  private resolveArrayMemberConstructor(source: any, index: number): ClassConstructor<any> {
    const destinationType = this.destinationType!;
    const isFactoryCallback = typeof destinationType === "function"
      && (destinationType as any).prototype === undefined;

    if (isFactoryCallback) {
      const factory = destinationType as ArrayMemberTypeFactoryCallbackType;
      const sampleInstance = factory(source, this.sourceProperty, index);
      return sampleInstance.constructor as ClassConstructor<any>;
    }

    return destinationType as ClassConstructor<any>;
  }

  /**
   * Run every direct child node against `(sourceElement, destinationElement)`. Each child
   * writes its mapped destination property onto `destinationElement`.
   */
  private async runSubNodes(sourceElement: any, destinationElement: any, normalizersMap: { [key in DataNormalizerUniqueKey]: DataNormalizerInterface<any, any> }, options?: DataMapperOptions): Promise<void> {
    for (const key in this.nodes) {
      if (this.nodes.hasOwnProperty(key) === false) {
        continue;
      }

      const node = this.nodes[key];

      await node.map(sourceElement, destinationElement, normalizersMap, options);
    }
  }

  /**
   * Rehydrate this node from a previously-exported sub-schema. Children are rebuilt via
   * `DataMappingSerializer.importChildren`, the same helper `DataMappingBuilder.import` uses
   * (so the two stay consistent).
   */
  public import(schema: any) {
    this.sourceProperty = schema.sourceProperty;
    this.destinationProperty = schema.destinationProperty;
    this.isOptional = schema.isOptional;
    this.nodes = DataMappingSerializer.importChildren(this.root, this, schema.nodes);
  }

  /**
   * Export this node as a plain object. Does not mutate the live tree — the builder remains
   * usable for mapping after this call returns.
   *
   * `destinationType` is intentionally not serialized: class constructors aren't transferable,
   * and factory callbacks (`ArrayMemberTypeFactoryCallbackType`) hold closures. To rehydrate a
   * schema with the same destination instantiation behavior, decorate the destination class
   * with class-transformer's `@Type()` and pass the destination class to `DataMapper.map()`.
   */
  public export() {
    return {
      "_type": this.type,
      "sourceProperty": this.sourceProperty,
      "destinationProperty": this.destinationProperty,
      "isOptional": this.isOptional,
      "nodes": DataMappingSerializer.exportChildren(this.nodes),
    }
  }
}
