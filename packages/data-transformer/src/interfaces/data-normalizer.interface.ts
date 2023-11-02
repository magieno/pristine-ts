import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";

export interface DataNormalizerInterface<T, R> {
    /**
     * Every data normalizer must define a unique key. Then, during the transformation, the schema can specify which
     * normalizer it must use. Using the unique key, we can quickly (in O(1)) retrieve the normalizer.
     */
    getUniqueKey(): DataNormalizerUniqueKey;

    /**
     * This method takes the source property value, can receive options to control the behaviour (example, you might
     * want to specify a number of significant digits or a data format) and returns the normalized value.
     * @param source
     * @param options
     */
    normalize(source: any, options?: R): T;
}
