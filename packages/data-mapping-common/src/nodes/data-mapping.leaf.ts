import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataNormalizerAlreadyAdded} from "../errors/data-normalizer-already-added.error";
import {DataMappingBuilder} from "../builders/data-mapping.builder";
import {DataMappingNode} from "./data-mapping.node";
import {DataMappingSourcePropertyNotFoundError} from "../errors/data-mapping-source-property-not-found.error";
import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";
import {ArrayDataMappingNodeInvalidSourcePropertyTypeError} from "../errors/array-data-mapping-node-invalid-source-property-type.error";
import {DataMapperOptions} from "../options/data-mapper.options";
import {DataNormalizerNotFoundError} from "../errors/data-normalizer-not-found.error";


export class DataMappingLeaf {
  /**
   * This property represents the property referenced in the `source` object.
   */
  public sourceProperty!: string;

  /**
   * This property represents the property referenced in the `destination` object.
   */
  public destinationProperty!: string;

  /**
   * This property contains an array of Normalizers to apply sequentially when mapping this property.
   */
  public normalizers: { key: DataNormalizerUniqueKey, options: any }[] = [];

  /**
   * This property contains an array of Normalizers that must be excluded from normalizers defined by parents.
   */
  public excludedNormalizers: Set<DataNormalizerUniqueKey> = new Set<DataNormalizerUniqueKey>();

  /**
   * Memoized merge of inherited root normalizers (minus excluded) and leaf-local normalizers.
   * Cleared whenever the leaf's normalizer configuration changes.
   */
  private effectiveNormalizersCache?: { key: DataNormalizerUniqueKey, options: any }[];

  /**
   * This method specified whether it's possible that this element not be present in the `source` object.
   */
  public isOptional: boolean = false;

  public constructor(
    private readonly root: DataMappingBuilder,
    public readonly parent: DataMappingNode | DataMappingBuilder,
    public readonly type: DataMappingNodeTypeEnum = DataMappingNodeTypeEnum.Leaf,
  ) {
  }

  /**
   * This is a setter for `sourceProperty`.
   * @param sourceProperty
   */
  public setSourceProperty(sourceProperty: string): DataMappingLeaf {
    this.sourceProperty = sourceProperty;
    return this;
  }

  /**
   * This is a setter for `destinationProperty`.
   * @param destinationProperty
   */
  public setDestinationProperty(destinationProperty: string): DataMappingLeaf {
    this.destinationProperty = destinationProperty;
    return this;
  }

  /**
   * This is a setter for `isOptional`.
   * @param isOptional
   */
  public setIsOptional(isOptional: boolean): DataMappingLeaf {
    this.isOptional = isOptional;

    return this;
  }

  /**
   * This methods adds a normalizer but checks that this normalizer hasn't been added already (either at the root) or
   * directly on this leaf.
   *
   * @param normalizerUniqueKey
   * @param options
   */
  public addNormalizer(normalizerUniqueKey: DataNormalizerUniqueKey, options?: any): DataMappingLeaf {
    if (this.hasNormalizer(normalizerUniqueKey)) {
      throw new DataNormalizerAlreadyAdded("The data normalizer '" + normalizerUniqueKey + "' has already been added to the leaf with destination property: '" + this.destinationProperty + "'.", normalizerUniqueKey, options)
    }

    if (this.root.hasNormalizer(normalizerUniqueKey)) {
      throw new DataNormalizerAlreadyAdded("The data normalizer '" + normalizerUniqueKey + "' has already been added to the root and cannot be also added to the leaf with destination property: '" + this.destinationProperty + "'.", normalizerUniqueKey, options)
    }

    this.normalizers.push({
      key: normalizerUniqueKey,
      options,
    });
    this.effectiveNormalizersCache = undefined;

    return this;
  }

  /**
   * This method simply returns whether the normalizer was already added to this node.
   * @param normalizerUniqueKey
   */
  public hasNormalizer(normalizerUniqueKey: DataNormalizerUniqueKey): boolean {
    return this.normalizers.find(element => element.key === normalizerUniqueKey) !== undefined;
  }

  /**
   * This method adds a normalizer that must be excluded from the normalizers applied at a higher level.à
   * @param normalizerUniqueKey
   */
  public excludeNormalizer(normalizerUniqueKey: DataNormalizerUniqueKey): DataMappingLeaf {
    if (this.excludedNormalizers.has(normalizerUniqueKey)) {
      throw new DataNormalizerAlreadyAdded("The EXCLUDED data normalizer '" + normalizerUniqueKey + "' has already been added to this source property: '" + this.sourceProperty + "'.", normalizerUniqueKey)
    }

    this.excludedNormalizers.add(normalizerUniqueKey);
    this.effectiveNormalizersCache = undefined;

    return this;
  }

  /**
   * Returns the merged list of normalizers applied to this leaf: inherited root normalizers minus the
   * ones explicitly excluded here, followed by leaf-local normalizers. Memoized — the cache is cleared
   * by `addNormalizer`/`excludeNormalizer`.
   */
  private getEffectiveNormalizers(): { key: DataNormalizerUniqueKey, options: any }[] {
    if (this.effectiveNormalizersCache === undefined) {
      this.effectiveNormalizersCache = [
        ...this.root.normalizers.filter(element => this.excludedNormalizers.has(element.key) === false),
        ...this.normalizers,
      ];
    }

    return this.effectiveNormalizersCache;
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

    const normalizers = this.getEffectiveNormalizers();

    if (this.type === DataMappingNodeTypeEnum.ScalarArray) {
      // This means that the source[propertyKey] contains an array of objects and each object should be mapped
      const array = source[this.sourceProperty];

      if (Array.isArray(array) === false) {
        throw new ArrayDataMappingNodeInvalidSourcePropertyTypeError(`According to your schema, the property '${this.sourceProperty}' in the source object must contain an Array of Scalar. Instead, it contains: '${typeof array}'.`, this.sourceProperty);
      }

      destination[this.destinationProperty] = [];

      for (let value of array) {
        for (const element of normalizers) {
          const normalizer = normalizersMap[element.key];
          if (normalizer === undefined) {
            throw new DataNormalizerNotFoundError("The normalizer '" + element.key + "' wasn't found and cannot be loaded for source property '" + this.sourceProperty + "'.", element.key);
          }
          value = normalizer.normalize(value, element.options);
        }

        destination[this.destinationProperty].push(value);
      }

      return;
    }

    let value = source[this.sourceProperty];
    for (const element of normalizers) {
      const normalizer = normalizersMap[element.key];
      if (normalizer === undefined) {
        throw new DataNormalizerNotFoundError("The normalizer '" + element.key + "' wasn't found and cannot be loaded for source property '" + this.sourceProperty + "'.", element.key);
      }
      value = normalizer.normalize(value, element.options);
    }

    destination[this.destinationProperty] = value;

    return;
  }

  /**
   * This method imports a schema.
   *
   * @param schema
   */
  public import(schema: any) {
    this.normalizers = Array.isArray(schema.normalizers) ? schema.normalizers : [];

    this.excludedNormalizers = new Set<DataNormalizerUniqueKey>()
    if (schema.hasOwnProperty("excludedNormalizers") && schema.excludedNormalizers) {
      for (const item in schema.excludedNormalizers) {
        if (schema.excludedNormalizers.hasOwnProperty(item) === false) {
          continue;
        }
        this.excludedNormalizers.add(item);
      }
    }

    this.isOptional = schema.isOptional;
    this.sourceProperty = schema.sourceProperty;
    this.destinationProperty = schema.destinationProperty;
    this.effectiveNormalizersCache = undefined;
  }

  /**
   * This method exports this node.
   */
  public export(): any {
    const excludedNormalizers: any = {}

    for (const element of this.excludedNormalizers.values()) {
      excludedNormalizers[element] = true;
    }

    return {
      "_type": this.type,
      "sourceProperty": this.sourceProperty,
      "destinationProperty": this.destinationProperty,
      "isOptional": this.isOptional,
      "normalizers": this.normalizers,
      "excludedNormalizers": excludedNormalizers,
    }
  }
}