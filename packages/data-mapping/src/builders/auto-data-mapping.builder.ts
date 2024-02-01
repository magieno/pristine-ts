import {ClassConstructor} from "class-transformer";
import {DataMappingBuilder} from "./data-mapping.builder";
import {DataMappingNode} from "../nodes/data-mapping.node";
import {ClassMetadata, PropertyMetadata, TypeEnum, TypeUtils} from "@pristine-ts/metadata";
import {DataMappingLeaf} from "../nodes/data-mapping.leaf";
import {NumberNormalizer} from "../normalizers/number.normalizer";
import {StringNormalizer} from "../normalizers/string.normalizer";
import {DateNormalizer} from "../normalizers/date.normalizer";
import {MetadataEnum} from "@pristine-ts/common";
import {TypeFactoryCallback} from "../decorators/type-factory.decorator";
import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {injectable} from "tsyringe";

@injectable()
export class AutoDataMappingBuilder {
    build(source: any, destinationType: ClassConstructor<any>): DataMappingBuilder {
        const dataMappingBuilder = new DataMappingBuilder();

        this.internalBuild(source, destinationType, dataMappingBuilder, dataMappingBuilder);

        return dataMappingBuilder;
    }

    private internalBuild(source: any, destinationType: ClassConstructor<any>, root: DataMappingBuilder,
                          parent: DataMappingNode | DataMappingBuilder) {
        if (source === undefined) {
            return;
        }

        // Get the metadata of destinationType and iterate over its properties.
        const classInformation = ClassMetadata.getInformation(destinationType);

        classInformation.properties.forEach(propertyKey => {
            // Retrieve the metadata for the property
            const propertyInformation = PropertyMetadata.getInformation(destinationType.prototype, propertyKey);

            // Check if we have a `@typeFactory` decorator. If we do, we execute it now to get the next destinationType
            // in the recursion.
            const typeFactoryCallback: TypeFactoryCallback = PropertyMetadata.getMetadata(destinationType.prototype, propertyKey, MetadataEnum.TypeFactory);

            let typeObject = propertyInformation.typeObject;

            if (typeFactoryCallback) {
                typeObject = typeFactoryCallback(source, propertyKey).constructor;
            }

            if (propertyInformation.typeEnum === TypeEnum.Object) {
                const dataMappingNode = new DataMappingNode(root, parent);
                dataMappingNode
                    .setSourceProperty(propertyKey)
                    .setDestinationProperty(propertyKey)
                    .setDestinationType(typeObject)
                    .setIsOptional(propertyInformation.isNullable ?? false) // todo: determine what the actual default should be for auto-mapping
                    .end();

                return this.internalBuild(source[propertyKey], typeObject, root, dataMappingNode);
            } else if (propertyInformation.typeEnum === TypeEnum.Array) {

                let nestedType: DataMappingNodeTypeEnum = DataMappingNodeTypeEnum.ScalarArray;


                if (source.hasOwnProperty(propertyKey) && Array.isArray(source[propertyKey]) && source[propertyKey].length > 0) {
                    const nestedElementType = TypeUtils.getTypeOfValue(source[propertyKey][0]);

                    switch (nestedElementType) {
                        case TypeEnum.Object:
                            nestedType = DataMappingNodeTypeEnum.ObjectArray;
                            break;
                    }
                }

                if (nestedType === DataMappingNodeTypeEnum.ScalarArray) {// An array of scalar has no children.
                    const dataMappingLeaf = parent.addArrayOfScalar();
                    dataMappingLeaf.setSourceProperty(propertyKey)
                        .setDestinationProperty(propertyKey)
                        .setIsOptional(propertyInformation.isNullable ?? false) // todo: determine what the actual default should be for auto-mapping
                        .end();
                    return;
                }

                const dataMappingNode = parent.addArrayOfObjects();
                dataMappingNode
                    .setSourceProperty(propertyKey)
                    .setDestinationProperty(propertyKey)
                    .setDestinationType(propertyInformation.arrayMemberObject)
                    .setIsOptional(propertyInformation.isNullable ?? false) // todo: determine what the actual default should be for auto-mapping
                    .end();

                // We assume all the objects are similar so we use only the first one to build the schema
                return this.internalBuild(source[propertyKey][0], propertyInformation.arrayMemberObject, root, dataMappingNode);
            }

            let normalizers: string[] = [];

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
                .setIsOptional(propertyInformation.isNullable ?? false) // todo: determine what the actual default should be for auto-mapping
                .end();
        })
    }
}