import {ClassConstructor} from "class-transformer";
import {DataMappingBuilder} from "./data-mapping.builder";
import {DataMappingNode} from "../nodes/data-mapping.node";
import {ClassMetadata, PropertyInformationEnum, PropertyMetadata, TypeEnum, TypeUtils} from "@pristine-ts/metadata";
import {DataMappingLeaf} from "../nodes/data-mapping.leaf";
import {NumberNormalizerUniqueKey} from "../normalizers/number.normalizer";
import {StringNormalizerUniqueKey} from "../normalizers/string.normalizer";
import {DateNormalizerUniqueKey} from "../normalizers/date.normalizer";
import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {AutoDataMappingBuilderOptions} from "../options/auto-data-mapping-builder.options";
import {MetadataEnum} from "../enums/metadata.enum";
import {TypeFactoryCallback} from "../types/type-factory-callback.type";
import {BooleanNormalizerUniqueKey} from "../normalizers/boolean.normalizer";

export class AutoDataMappingBuilder {
  /**
   * Schema cache keyed by destination class. The auto-built schema is deterministic in `destinationType`
   * + the *shape* of the source (which decoration metadata describes), so for a stable class definition
   * the same builder can be reused across calls. We key only by destinationType to keep things simple;
   * if the source shape varies and the auto-inference depends on it (e.g. inferring scalar-array member
   * type from `source[propertyKey][0]`), callers needing fresh inference can bypass the cache via the
   * `disableCache` option.
   *
   * Stored under a WeakMap so unused destination classes can be garbage-collected.
   */
  private readonly cache: WeakMap<ClassConstructor<any>, DataMappingBuilder> = new WeakMap();

  /**
   * This method receives a source object and a destinationType that corresponds to the type of the class
   * that the source should be mapped to. It then creates a DataMappingBuilder object that contains the schema
   * needed to map the source to the destinationType.
   * @param source
   * @param destinationType
   * @param options
   */
  build(source: any, destinationType: ClassConstructor<any>, options?: AutoDataMappingBuilderOptions): DataMappingBuilder {
    const resolvedOptions = new AutoDataMappingBuilderOptions(options);

    if (resolvedOptions.disableCache === false) {
      const cached = this.cache.get(destinationType);
      if (cached !== undefined) {
        return cached;
      }
    }

    const dataMappingBuilder = new DataMappingBuilder();

    this.internalBuild(source, destinationType, dataMappingBuilder, dataMappingBuilder, resolvedOptions);

    if (resolvedOptions.disableCache === false) {
      this.cache.set(destinationType, dataMappingBuilder);
    }

    return dataMappingBuilder;
  }

  /**
   * Clear the cached schema for a destinationType (or the whole cache when no argument is passed).
   * Useful in tests, or when class metadata changes at runtime (rare).
   */
  public clearCache(destinationType?: ClassConstructor<any>): void {
    if (destinationType === undefined) {
      // WeakMap has no .clear() — recreate.
      (this as any).cache = new WeakMap<ClassConstructor<any>, DataMappingBuilder>();
      return;
    }

    this.cache.delete(destinationType);
  }

  /**
   * This method is the internal method that is called recursively to build the schema.
   *
   * @param source
   * @param destinationType
   * @param root
   * @param parent
   * @param options
   * @private
   */
  private internalBuild(source: any, destinationType: ClassConstructor<any>, root: DataMappingBuilder,
                        parent: DataMappingNode | DataMappingBuilder, options: AutoDataMappingBuilderOptions) {
    if (!source || !destinationType) {
      return;
    }

    try {
      // Get the metadata of destinationType and iterate over its properties.
      const classInformation = ClassMetadata.getInformation(destinationType);

      classInformation.properties.forEach(propertyKey => {
        // Retrieve the metadata for the property
        const propertyInformation = PropertyMetadata.getInformation(destinationType.prototype, propertyKey);

        let typeObject = propertyInformation.typeObject;

        // Check if we have a `@typeFactory` decorator, it means that there's a callback that must be executed
        // for this property to retrieve the actual DestinationType object. If there's one, execute it.
        const typeFactoryCallback: TypeFactoryCallback = PropertyMetadata.getMetadata(destinationType.prototype, propertyKey, MetadataEnum.TypeFactory);

        if (typeFactoryCallback) {
          typeObject = typeFactoryCallback(source, propertyKey).constructor;
        }

        // If the property references an object, this means that we need to recursively call this method to build the schema.
        if (propertyInformation.typeEnum === TypeEnum.Object) {
          const dataMappingNode = new DataMappingNode(root, parent);
          dataMappingNode
            .setSourceProperty(propertyKey)
            .setDestinationProperty(propertyKey)
            .setDestinationType(typeObject)
            .setIsOptional(propertyInformation.isNullable ?? options.isOptionalDefaultValue)
            .end();

          return this.internalBuild(source[propertyKey], typeObject, root, dataMappingNode, options);
        } else if (propertyInformation.typeEnum === TypeEnum.Array) { // If the property references an array, we need to iterate over each element and recursively call this method to build the schema.

          let nestedType: DataMappingNodeTypeEnum = DataMappingNodeTypeEnum.ScalarArray;

          if (!source.hasOwnProperty(propertyKey) || Array.isArray(source[propertyKey]) === false || source[propertyKey].length === 0) {
            return;
          }

          let arrayMemberType = PropertyMetadata.getMetadata(destinationType.prototype, propertyKey, MetadataEnum.ArrayMemberTypeFactory)

          if (arrayMemberType === undefined) { // If this is undefined, then we it's possible that it's a ScalarArray.
            arrayMemberType = PropertyMetadata.getMetadata(destinationType.prototype, propertyKey, PropertyInformationEnum.ArrayMemberType) ?? source[propertyKey][0];  // Use the first element in the array to determine the type of content stored in the array if not type have been passed. Here, we assume that all the elements in the array are of the same type.

            const nestedElementType = TypeUtils.getTypeOfValue(arrayMemberType);

            switch (nestedElementType) {
              case TypeEnum.Object:
                nestedType = DataMappingNodeTypeEnum.ObjectArray;
                break;
            }

            // If the array is an array of scalars, then it will be a LeafNode of type ScalarArray with no children.
            if (nestedType === DataMappingNodeTypeEnum.ScalarArray) {
              const dataMappingLeaf = parent.addArrayOfScalar();
              const normalizers: string[] = [];

              // todo: Allow for options to be specified per attribute. We should probably add a decorator to can customize the normalizer.
              switch (nestedElementType) {
                case TypeEnum.Number:
                  normalizers.push(NumberNormalizerUniqueKey);
                  break;

                case TypeEnum.String:
                  normalizers.push(StringNormalizerUniqueKey);
                  break;

                case TypeEnum.Date:
                  normalizers.push(DateNormalizerUniqueKey);
                  break;
              }
              normalizers.forEach(normalizer => dataMappingLeaf.addNormalizer(normalizer));

              dataMappingLeaf.setSourceProperty(propertyKey)
                .setDestinationProperty(propertyKey)
                .setIsOptional(propertyInformation.isNullable ?? options.isOptionalDefaultValue)
                .end();
              return;
            }
          }

          // Else, it's an array of objects and we must iterate over the first element to get all the properties and
          // build the tree.
          const dataMappingNode = parent.addArrayOfObjects();
          dataMappingNode
            .setSourceProperty(propertyKey)
            .setDestinationProperty(propertyKey)
            .setDestinationType(arrayMemberType)
            .setIsOptional(propertyInformation.isNullable ?? options.isOptionalDefaultValue)
            .end();

          // We assume all the objects are similar so we use only the first one to build the schema
          return this.internalBuild(source[propertyKey][0], propertyInformation.arrayMemberObject, root, dataMappingNode, options);
        }

        const normalizers: string[] = [];

        // todo: Allow for options to be specified per attribute. We should probably add a decorator to can customize the normalizer.
        switch (propertyInformation.typeEnum) {
          case TypeEnum.Boolean:
            normalizers.push(BooleanNormalizerUniqueKey);
            break;
          case TypeEnum.Number:
            normalizers.push(NumberNormalizerUniqueKey);
            break;

          case TypeEnum.String:
            normalizers.push(StringNormalizerUniqueKey);
            break;

          case TypeEnum.Date:
            normalizers.push(DateNormalizerUniqueKey);
            break;
        }

        const dataMappingLeaf = new DataMappingLeaf(root, parent);
        normalizers.forEach(normalizer => dataMappingLeaf.addNormalizer(normalizer));

        dataMappingLeaf
          .setSourceProperty(propertyKey)
          .setDestinationProperty(propertyKey)
          .setIsOptional(propertyInformation.isNullable ?? options.isOptionalDefaultValue)
          .end();
      })
    } catch (e) {
      if (options?.logErrors) {
        console.error(e);
      }

      if (options?.throwOnErrors) {
        throw e;
      }
    }
  }
}