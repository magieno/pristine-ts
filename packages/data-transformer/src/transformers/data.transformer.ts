import {injectable, injectAll} from "tsyringe";
import {moduleScoped, tag} from "@pristine-ts/common";
import {DataTransformerModuleKeyname} from "../data-transformer.module.keyname";
import {DataNormalizer} from "../interfaces/data-normalizer.interface";
import {DataTransformerBuilder} from "./data-transformer.builder";
import {DataTransformerProperty} from "./data-transformer.property";
import {DataTransformerSourcePropertyNotFoundError} from "../errors/data-transformer-source-property-not-found.error";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataTransformerRow} from "../types/data-transformer.row";
import {DataTransformerInterceptorUniqueKeyType} from "../types/data-transformer-interceptor-unique-key.type";
import {DataTransformerInterceptor} from "../interfaces/data-transformer-interceptor.interface";
import {DataTransformerInterceptorNotFoundError} from "../errors/data-transformer-interceptor-not-found.error";

@moduleScoped(DataTransformerModuleKeyname)
@injectable()
export class DataTransformer {
    private readonly dataNormalizersMap: { [key in DataNormalizerUniqueKey]: DataNormalizer<any, any>} = {}
    private readonly dataTransformerInterceptorsMap: { [key in DataTransformerInterceptorUniqueKeyType]: DataTransformerInterceptor} = {}

    public constructor(@injectAll("DataNormalizerInterface") private readonly dataNormalizers: DataNormalizer<any, any>[],
                       @injectAll("DataTransformerInterceptor") private readonly dataTransformerInterceptors: DataTransformerInterceptor[],) {
        dataNormalizers.forEach(dataNormalizer => {
            this.dataNormalizersMap[dataNormalizer.getUniqueKey()] = dataNormalizer;
        })

        dataTransformerInterceptors.forEach(interceptor => {
           this.dataTransformerInterceptorsMap[interceptor.getUniqueKey()] = interceptor;
        });
    }

    public async transform(builder: DataTransformerBuilder, source: (DataTransformerRow)[]): Promise<DataTransformerRow[]> {
        const globalNormalizers = builder.normalizers;

        const destination: DataTransformerRow[] = [];

        let row: DataTransformerRow = {};
        for(const key in source) {
            if(source.hasOwnProperty(key) === false) {
                continue;
            }

            let interceptedInputRow = source[key];

            // Execute the before row interceptors.
            for(const element of builder.beforeRowTransformInterceptors) {
                const interceptor = this.dataTransformerInterceptorsMap[element.key];

                if(interceptor === undefined) {
                    throw new DataTransformerInterceptorNotFoundError("The interceptor wasn't found and cannot be loaded.", element.key);
                }

                // todo: Pass the options when we start using them.
                interceptedInputRow = await interceptor.beforeRowTransform(interceptedInputRow);
            }

            // Loop over the properties defined in the builder
            for (const key in builder.properties) {
                if(builder.properties.hasOwnProperty(key) === false) {
                    continue;
                }

                const property: DataTransformerProperty = builder.properties[key];
                if(interceptedInputRow.hasOwnProperty(property.sourceProperty) === false) {
                    if(property.isOptional) {
                        continue;
                    }

                    throw new DataTransformerSourcePropertyNotFoundError("The property '" + key + "' isn't found in the Source object and isn't marked as Optional. If you want to ignore this property, use the 'setIsOptional(true)' method in the builder.", key)
                }

                let value = interceptedInputRow[property.sourceProperty];

                // Remove the normalizers part of the excludedNormalizers
                const normalizers = globalNormalizers.filter(element => property.excludedNormalizers.has(element.key) === false);
                normalizers.push(...property.normalizers);

                normalizers.forEach(element => {
                    const dataNormalizer = this.dataNormalizersMap[element.key];
                    value = dataNormalizer.normalize(value, element.options);
                })

                // Assign the resulting value in the destination
                row[property.destinationProperty] = value;
            }

            // Execute the before row interceptors.
            for(const element of builder.afterRowTransformInterceptors) {
                const interceptor: DataTransformerInterceptor  = this.dataTransformerInterceptorsMap[element.key];

                if(interceptor === undefined) {
                    throw new DataTransformerInterceptorNotFoundError("The interceptor wasn't found and cannot be loaded.", element.key);
                }

                // todo pass the options when we start using it.
                row = await interceptor.afterRowTransform(row);
            }

            destination.push(row);
        }

        return destination;
    }
}