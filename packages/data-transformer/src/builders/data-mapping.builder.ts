import {DataMappingNode} from "../mapping-nodes/data-mapping.node";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataNormalizerAlreadyAdded} from "../errors/data-normalizer-already-added.error";
import {DataTransformerInterceptorUniqueKeyType} from "../types/data-transformer-interceptor-unique-key.type";
import {
    DataBeforeRowTransformerInterceptorAlreadyAddedError
} from "../errors/data-before-row-transformer-interceptor-already-added.error";
import {
    DataAfterRowTransformerInterceptorAlreadyAddedError
} from "../errors/data-after-row-transformer-interceptor-already-added.error";
import {DataTransformerProperty} from "../transformers/data-transformer.property";
import {DataMappingLeaf} from "../mapping-nodes/data-mapping.leaf";
import {UndefinedSourcePropertyError} from "../errors/undefined-source-property.error";
import {BaseDataMappingNode} from "../mapping-nodes/base-data-mapping.node";
import {ArrayDataMappingNode} from "../mapping-nodes/array-data-mapping.node";
import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";

export class DataMappingBuilder extends BaseDataMappingNode{
    public normalizers: { key: DataNormalizerUniqueKey, options: any}[] = [];
    public beforeRowTransformInterceptors: { key: DataTransformerInterceptorUniqueKeyType, options: any}[] = [];
    public afterRowTransformInterceptors: { key: DataTransformerInterceptorUniqueKeyType, options: any}[] = [];


    public addNormalizer(normalizerUniqueKey: DataNormalizerUniqueKey, options?: any): DataMappingBuilder {
        if(this.hasNormalizer(normalizerUniqueKey)) {
            throw new DataNormalizerAlreadyAdded("The data normalizer '" + normalizerUniqueKey + "' has already been added to this builder.", normalizerUniqueKey, options);
        }

        this.normalizers.push({
            key: normalizerUniqueKey,
            options,
        });
        return this;
    }

    public hasNormalizer(normalizerUniqueKey: DataNormalizerUniqueKey): boolean {
        return this.normalizers.find(element => element.key === normalizerUniqueKey) !== undefined;
    }

    public addBeforeRowTransformInterceptor(key: DataTransformerInterceptorUniqueKeyType, options?: any): DataMappingBuilder {
        if(this.hasBeforeRowTransformInterceptor(key)) {
            throw new DataBeforeRowTransformerInterceptorAlreadyAddedError("The before row transform interceptor has already been added to this Tree.", key, options)
        }

        this.beforeRowTransformInterceptors.push({
            key,
            options,
        });

        return this;
    }

    public hasBeforeRowTransformInterceptor(key: DataTransformerInterceptorUniqueKeyType): boolean {
        return this.beforeRowTransformInterceptors.find(element => element.key === key) !== undefined;
    }

    public addAfterRowTransformInterceptor(key: DataTransformerInterceptorUniqueKeyType, options?: any): DataMappingBuilder {
        if(this.hasAfterRowTransformInterceptor(key)) {
            throw new DataAfterRowTransformerInterceptorAlreadyAddedError("The after row transform interceptor has already been added to this Tree.", key, options)
        }

        this.afterRowTransformInterceptors.push({
            key,
            options,
        });

        return this;
    }

    public hasAfterRowTransformInterceptor(key: DataTransformerInterceptorUniqueKeyType): boolean {
        return this.afterRowTransformInterceptors.find(element => element.key === key) !== undefined;
    }

    public add() {
        return new DataMappingLeaf(this, this);
    }


    public addNestingLevel() {
        return new DataMappingNode(this, this);
    }

    public addArray() {
        return new DataMappingNode(this, this, DataMappingNodeTypeEnum.Array);
    }
    /**
     * This method is called at the end just to make it nice since all the nodes will have one, it's nice
     * that the builder has one too.
     */
    public end(): DataMappingBuilder {
        return this;
    }

}