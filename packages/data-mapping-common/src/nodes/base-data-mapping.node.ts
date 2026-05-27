import {DataMappingNode} from "./data-mapping.node";
import {DataMappingLeaf} from "./data-mapping.leaf";
import {UndefinedSourcePropertyError} from "../errors/undefined-source-property.error";
import {UndefinedDestinationPropertyError} from "../errors/undefined-destination-property.error";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {ClassConstructor} from "class-transformer";
import {ArrayMemberTypeFactoryCallbackType} from "../types/array-member-type-factory-callback.type";

/**
 * Options for a leaf field (`field()` and `arrayOfScalars()`).
 *
 * Inline interface — these are small, internal to the fluent API, and won't grow runtime
 * defaults the way the existing `DataMapperOptions` / `AutoDataMappingBuilderOptions` classes
 * do. Splitting them into their own files would be ceremony without payoff.
 */
export interface FluentLeafOptions {
  /**
   * Normalizers to apply to the value as it flows from source to destination. Each entry is
   * either a unique key (shorthand) or `{key, options}` to pass normalizer-specific options.
   */
  normalizers?: Array<DataNormalizerUniqueKey | {key: DataNormalizerUniqueKey, options?: any}>;

  /**
   * Normalizers added at the builder root that should NOT apply to this leaf. Useful when a
   * global normalizer (e.g. lowercase everything) needs to be skipped for one specific field
   * (e.g. an API key that's case-sensitive).
   */
  excludeNormalizers?: DataNormalizerUniqueKey[];

  /**
   * When true, the leaf is skipped silently if the source property is missing. When false /
   * undefined, a missing source property throws `DataMappingSourcePropertyNotFoundError`.
   */
  isOptional?: boolean;
}

/**
 * Options for a single nested object (`nested()`).
 */
export interface FluentNestedOptions {
  isOptional?: boolean;
  /**
   * If set, the destination property is instantiated as this class (via `plainToInstance`).
   * Without it, the destination is a plain object.
   */
  destinationType?: ClassConstructor<any>;
}

/**
 * Options for an array of nested objects (`arrayOfObjects()`).
 *
 * `destinationType` here accepts a factory callback in addition to a class constructor, for
 * polymorphic arrays where each element maps to a different class.
 */
export interface FluentArrayOfObjectsOptions {
  isOptional?: boolean;
  destinationType?: ClassConstructor<any> | ArrayMemberTypeFactoryCallbackType;
}

export abstract class BaseDataMappingNode {
  public nodes: { [sourceProperty in string]: DataMappingNode | DataMappingLeaf } = {};

  // ── Low-level builder API (existing) ──────────────────────────────────────────────────
  //
  // Both DataMappingBuilder and DataMappingNode implement these. Declared abstract here so
  // the sugar methods below can call them generically — no need to duplicate the sugar in
  // each concrete subclass.

  public abstract add(): DataMappingLeaf;
  public abstract addNestingLevel(): DataMappingNode;
  public abstract addArrayOfObjects(): DataMappingNode;
  public abstract addArrayOfScalar(): DataMappingLeaf;

  // ── Fluent / sugar API ────────────────────────────────────────────────────────────────
  //
  // Sugar layer over the low-level chain. Each call returns `this` so calls compose without
  // explicit `.end()`. Nested structures take a build callback that scopes the inner config
  // — the framework handles the `.end()` for you.

  /**
   * Add a leaf mapping. `field(src)` is shorthand for `field(src, src)` (no rename).
   *
   * Equivalent to `.add().setSourceProperty(src).setDestinationProperty(dst).end()`, plus
   * applying normalizer / optional / excludeNormalizers options.
   */
  public field(source: string, destination?: string, options?: FluentLeafOptions): this {
    const leaf = this.add()
      .setSourceProperty(source)
      .setDestinationProperty(destination ?? source);

    BaseDataMappingNode.applyLeafOptions(leaf, options);

    leaf.end();
    return this;
  }

  /**
   * Add a nested object mapping. The build callback receives the new node and configures its
   * children — no explicit `.end()` needed; this method calls it for you when the callback
   * returns.
   */
  public nested(
    source: string,
    destination: string,
    build: (node: DataMappingNode) => void,
    options?: FluentNestedOptions,
  ): this {
    const node = this.addNestingLevel()
      .setSourceProperty(source)
      .setDestinationProperty(destination);

    if (options?.isOptional !== undefined) {
      node.setIsOptional(options.isOptional);
    }
    if (options?.destinationType !== undefined) {
      node.setDestinationType(options.destinationType);
    }

    build(node);

    node.end();
    return this;
  }

  /**
   * Add an array-of-objects mapping. The build callback configures the per-element schema —
   * every element in the source array is mapped through it. `destinationType` can be a class
   * (uniform array) or a factory callback (polymorphic array).
   */
  public arrayOfObjects(
    source: string,
    destination: string,
    build: (node: DataMappingNode) => void,
    options?: FluentArrayOfObjectsOptions,
  ): this {
    const node = this.addArrayOfObjects()
      .setSourceProperty(source)
      .setDestinationProperty(destination);

    if (options?.isOptional !== undefined) {
      node.setIsOptional(options.isOptional);
    }
    if (options?.destinationType !== undefined) {
      node.setDestinationType(options.destinationType);
    }

    build(node);

    node.end();
    return this;
  }

  /**
   * Add an array-of-scalars mapping. Normalizers in `options` apply to every element of the
   * array, not to the array itself. `arrayOfScalars(src)` is shorthand for same-name source
   * and destination.
   */
  public arrayOfScalars(source: string, destination?: string, options?: FluentLeafOptions): this {
    const leaf = this.addArrayOfScalar()
      .setSourceProperty(source)
      .setDestinationProperty(destination ?? source);

    BaseDataMappingNode.applyLeafOptions(leaf, options);

    leaf.end();
    return this;
  }

  /**
   * Called by the node itself to tell its parent that it has been built and is ready to be
   * added. We use this mechanism to force the `end()` method on the leaf to be called so we
   * can do some validations before adding it to the tree.
   */
  public addNode(node: DataMappingLeaf | DataMappingNode) {
    if (node.sourceProperty === undefined) {
      throw new UndefinedSourcePropertyError(node);
    }

    if (node.destinationProperty === undefined) {
      throw new UndefinedDestinationPropertyError(node);
    }

    this.nodes[node.sourceProperty] = node;
  }

  /**
   * Shared between `field()` and `arrayOfScalars()` — both take the same options shape.
   * Static helper so it can be called against either a freshly-built leaf or any leaf type.
   */
  private static applyLeafOptions(leaf: DataMappingLeaf, options?: FluentLeafOptions): void {
    if (options === undefined) {
      return;
    }

    if (options.isOptional !== undefined) {
      leaf.setIsOptional(options.isOptional);
    }

    options.excludeNormalizers?.forEach(key => leaf.excludeNormalizer(key));

    options.normalizers?.forEach(entry => {
      if (typeof entry === "string") {
        leaf.addNormalizer(entry);
      } else {
        leaf.addNormalizer(entry.key, entry.options);
      }
    });
  }
}
