import {ClassConstructor} from "class-transformer";
import {DataMappingBuilder} from "./data-mapping.builder";
import {DataMappingNode} from "../nodes/data-mapping.node";
import {ClassMetadata, PropertyMetadata, TypeEnum, TypeUtils} from "@pristine-ts/metadata";
import {DataMappingLeaf} from "../nodes/data-mapping.leaf";
import {NumberNormalizer} from "../normalizers/number.normalizer";
import {StringNormalizer} from "../normalizers/string.normalizer";
import {DateNormalizer} from "../normalizers/date.normalizer";
import {MetadataEnum} from "@pristine-ts/common";
import {TypeFactoryCallback} from "../decorators/type.decorator";
import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {injectable} from "tsyringe";
import {AutoDataMappingBuilderOptions} from "../options/auto-data-mapping-builder.options";

@injectable()
export class AutoDataMappingBuilder {
    /**
     * This method receives a source object and a destinationType that corresponds to the type of the class
     * that the source should be mapped to. It then creates a DataMappingBuilder object that contains the schema
     * needed to map the source to the destinationType.
     * @param source
     * @param destinationType
     * @param options
     */
    build(source: any, destinationType: ClassConstructor<any>, options?: AutoDataMappingBuilderOptions): DataMappingBuilder {
        const dataMappingBuilder = new DataMappingBuilder();

        this.internalBuild(source, destinationType, dataMappingBuilder, dataMappingBuilder, new AutoDataMappingBuilderOptions(options));

        return dataMappingBuilder;
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
        if (source === undefined) {
            return;
        }

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

                // Use the first element in the array to determine the type of content stored in the array. Here, we assume that all the elements in the array are of the same type.
                const nestedElementType = TypeUtils.getTypeOfValue(source[propertyKey][0]);

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
                            normalizers.push(NumberNormalizer.name);
                            break;

                        case TypeEnum.String:
                            normalizers.push(StringNormalizer.name);
                            break;

                        case TypeEnum.Date:
                            normalizers.push(DateNormalizer.name);
                            break;
                    }
                    normalizers.forEach(normalizer => dataMappingLeaf.addNormalizer(normalizer));

                    dataMappingLeaf.setSourceProperty(propertyKey)
                        .setDestinationProperty(propertyKey)
                        .setIsOptional(propertyInformation.isNullable ?? options.isOptionalDefaultValue)
                        .end();
                    return;
                }

                // Else, it's an array of objects and we must iterate over the first element to get all the properties and
                // build the tree.
                const dataMappingNode = parent.addArrayOfObjects();
                dataMappingNode
                    .setSourceProperty(propertyKey)
                    .setDestinationProperty(propertyKey)
                    .setDestinationType(propertyInformation.arrayMemberObject)
                    .setIsOptional(propertyInformation.isNullable ?? options.isOptionalDefaultValue)
                    .end();

                // We assume all the objects are similar so we use only the first one to build the schema
                return this.internalBuild(source[propertyKey][0], propertyInformation.arrayMemberObject, root, dataMappingNode, options);
            }

            const normalizers: string[] = [];

            // todo: Allow for options to be specified per attribute. We should probably add a decorator to can customize the normalizer.
            switch (propertyInformation.typeEnum) {
                case TypeEnum.Number:
                    normalizers.push(NumberNormalizer.name);
                    break;

                case TypeEnum.String:
                    normalizers.push(StringNormalizer.name);
                    break;

                case TypeEnum.Date:
                    normalizers.push(DateNormalizer.name);
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
    }
}