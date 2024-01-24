import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";
import {DataMappingInterceptorUniqueKeyType} from "../types/data-mapping-interceptor-unique-key.type";
import {DataMappingInterceptorInterface} from "../interfaces/data-mapping-interceptor.interface";
import {moduleScoped} from "@pristine-ts/common";
import {DataMappingModuleKeyname} from "../data-mapping.module.keyname";
import {injectable, injectAll} from "tsyringe";
import {DataMappingBuilder} from "../builders/data-mapping.builder";
import {ClassConstructor, plainToInstance} from "class-transformer";
import {DataMappingInterceptorNotFoundError} from "../errors/data-mapping-interceptor-not-found.error";

@moduleScoped(DataMappingModuleKeyname)
@injectable()
export class DataMapper {
    private readonly dataNormalizersMap: { [key in DataNormalizerUniqueKey]: DataNormalizerInterface<any, any> } = {}
    private readonly dataTransformerInterceptorsMap: { [key in DataMappingInterceptorUniqueKeyType]: DataMappingInterceptorInterface } = {}

    public constructor(@injectAll("DataNormalizerInterface") private readonly dataNormalizers: DataNormalizerInterface<any, any>[],
                       @injectAll("DataTransformerInterceptor") private readonly dataTransformerInterceptors: DataMappingInterceptorInterface[],) {
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
     * This method takes a builder, a source and maps it according to the builder. You can pass a `destinationType (optional)`
     * that is an object that will be constructed.
     *
     * @param builder
     * @param source
     * @param destinationType
     */
    public async map(builder: DataMappingBuilder, source: any, destinationType?: ClassConstructor<any>): Promise<any> {
        let destination = {};

        let interceptedSource = source;

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
            await node.map(interceptedSource, destination, this.dataNormalizersMap);
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