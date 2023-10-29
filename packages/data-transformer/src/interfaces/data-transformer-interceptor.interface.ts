import {DataTransformerRow} from "../types/data-transformer.row";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataTransformerInterceptorUniqueKeyType} from "../types/data-transformer-interceptor-unique-key.type";

export interface DataTransformerInterceptor {
    /**
     * Every data transformer interceptor must define a unique key. Then, during the transformation, the schema can specify which
     * interceptors must be called.
     */
    getUniqueKey(): DataTransformerInterceptorUniqueKeyType;

    /**
     * This method is called before the row is being transformed and normalized. It allows you to combine fields for example if that's what you want.
     * @param row
     */
    beforeRowTransform(row: DataTransformerRow): Promise<DataTransformerRow>;

    /**
     * This method is called after the row is being transformed and normalized. It can allow you to apply operations on each
     * field or combine fields for example.
     * @param row
     */
    afterRowTransform(row: DataTransformerRow): Promise<DataTransformerRow>;
}