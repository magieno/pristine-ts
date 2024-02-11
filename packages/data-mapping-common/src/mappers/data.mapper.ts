import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";
import {DataMappingInterceptorUniqueKeyType} from "../types/data-mapping-interceptor-unique-key.type";
import {DataMappingInterceptorInterface} from "../interfaces/data-mapping-interceptor.interface";
import {DataMappingBuilder} from "../builders/data-mapping.builder";
import {ClassConstructor, plainToInstance} from "class-transformer";
import {DataMappingInterceptorNotFoundError} from "../errors/data-mapping-interceptor-not-found.error";
import {ClassMetadata} from "@pristine-ts/metadata";
import {AutoDataMappingBuilder} from "../builders/auto-data-mapping.builder";
import {AutoDataMappingBuilderOptions} from "../options/auto-data-mapping-builder.options";
import {DataMapperOptions} from "../options/data-mapper.options";

export class DataMapper {
    private readonly dataNormalizersMap: { [key in DataNormalizerUniqueKey]: DataNormalizerInterface<any, any> } = {}
    private readonly dataTransformerInterceptorsMap: { [key in DataMappingInterceptorUniqueKeyType]: DataMappingInterceptorInterface } = {}

    public constructor(
        private readonly autoDataMappingBuilder: AutoDataMappingBuilder,
        private readonly dataNormalizers: DataNormalizerInterface<any, any>[],
        private readonly dataTransformerInterceptors: DataMappingInterceptorInterface[],) {
        dataNormalizers.forEach(dataNormalizer => {
            this.dataNormalizersMap[dataNormalizer.getUniqueKey()] = dataNormalizer;
        })

        dataTransformerInterceptors.forEach(interceptor => {
            this.dataTransformerInterceptorsMap[interceptor.getUniqueKey()] = interceptor;
        });
    }

    /**
     * This method takes an array of source and maps each item.
     *
     * @param builder
     * @param source
     * @param destinationType
     */
    public async mapAll(builder: DataMappingBuilder, source: any[], destinationType?: ClassConstructor<any>): Promise<any[]> {
        const destination = [];

        for(const element of source) {
            destination.push(await this.map(builder, element, destinationType));
        }

        return destination;
    }

    /**
     * This method automatically maps a source object into the DestinationType.
     * @param source
     * @param destinationType
     * @param options
     */
    public async autoMap(source: any | any[], destinationType: ClassConstructor<any>, options?: AutoDataMappingBuilderOptions): Promise<any> {
        try {
            if(Array.isArray(source)) {
                if(source.length === 0) {
                    return [];
                }

                const dataMappingBuilder = this.autoDataMappingBuilder.build(source[0], destinationType, options);

                const destination = [];

                for(const element of source) {
                    destination.push(await this.map(dataMappingBuilder, element, destinationType, new DataMapperOptions({
                        excludeExtraneousValues: options?.excludeExtraneousValues,
                    })));
                }

                return destination;
            }

            const dataMappingBuilder = this.autoDataMappingBuilder.build(source, destinationType, options);

            return await this.map(dataMappingBuilder, source, destinationType, new DataMapperOptions({
                excludeExtraneousValues: options?.excludeExtraneousValues,
            }));
        } catch (e) {
            console.error(e);

            // Return the source on error.
            return source;
        }
    }

    /**
     * This method takes a builder, a source and maps it according to the builder. You can pass a `destinationType (optional)`
     * that is an object that will be constructed.
     *
     * @param builder
     * @param source
     * @param destinationType
     * @param options
     */
    public async map(builder: DataMappingBuilder, source: any, destinationType?: ClassConstructor<any>, options?: DataMapperOptions): Promise<any> {
        let destination: any = {};

        if (options?.excludeExtraneousValues === false) {
            Object.keys(source).forEach(property => {
                destination[property] = source[property];
            })
        }

        let interceptedSource = source;

        options = new DataMapperOptions(options);

        // Execute the before interceptors.
        for (const element of builder.beforeMappingInterceptors) {
            const interceptor = this.dataTransformerInterceptorsMap[element.key];

            if (interceptor === undefined) {
                throw new DataMappingInterceptorNotFoundError("The interceptor wasn't found and cannot be loaded.", element.key);
            }

            // todo: Pass the options when we start using them.
            interceptedSource = await interceptor.beforeMapping(interceptedSource);
        }

        // Loop over the properties defined in the builder
        for (const key in builder.nodes) {
            if(builder.nodes.hasOwnProperty(key) === false) {
                continue;
            }

            const node = builder.nodes[key];
            await node.map(interceptedSource, destination, this.dataNormalizersMap, options);
        }

        // Execute the before interceptors.
        for (const element of builder.afterMappingInterceptors) {
            const interceptor: DataMappingInterceptorInterface = this.dataTransformerInterceptorsMap[element.key];

            if (interceptor === undefined) {
                throw new DataMappingInterceptorNotFoundError("The interceptor wasn't found and cannot be loaded.", element.key);
            }

            // todo pass the options when we start using it.
            destination = await interceptor.afterMapping(destination);
        }

        if(destinationType) {
            destination = plainToInstance(destinationType, destination);
        }

        return destination;
    }
}