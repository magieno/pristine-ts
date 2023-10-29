import {injectable, injectAll} from "tsyringe";
import {moduleScoped, tag} from "@pristine-ts/common";
import {DataTransformerModuleKeyname} from "../data-transformer.module.keyname";
import {DataNormalizer} from "../interfaces/data-normalizer.interface";
import {DataTransformerBuilder} from "./data-transformer.builder";
import {DataTransformerProperty} from "./data-transformer.property";
import {DataTransformerSourcePropertyNotFoundError} from "../errors/data-transformer-source-property-not-found.error";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";

@moduleScoped(DataTransformerModuleKeyname)
@injectable()
export class DataTransformer {
    private readonly dataNormalizersMap: { [key in DataNormalizerUniqueKey]: DataNormalizer<any, any>} = {}

    public constructor(@injectAll("DataNormalizerInterface") private readonly dataNormalizers: DataNormalizer<any, any>[]) {
        dataNormalizers.forEach(dataNormalizer => {
            this.dataNormalizersMap[dataNormalizer.getUniqueKey()] = dataNormalizer;
        })
    }

    public transform(builder: DataTransformerBuilder, source: ({[key in string]: any} | any)[]): {[key in string]: any}[] {
        const globalNormalizers = builder.normalizers;

        const destination: {[key in string]: any}[] = [];

        const row: any = {};
        for(const key in source) {
            if(source.hasOwnProperty(key) === false) {
                continue;
            }

            const inputRow = source[key];

            // Loop over the properties defined in the builder
            for (const key in builder.properties) {
                if(builder.properties.hasOwnProperty(key) === false) {
                    continue;
                }

                const property: DataTransformerProperty = builder.properties[key];
                if(inputRow.hasOwnProperty(property.sourceProperty) === false) {
                    if(property.isOptional) {
                        continue;
                    }

                    throw new DataTransformerSourcePropertyNotFoundError("The property '" + key + "' isn't found in the Source object and isn't marked as Optional. If you want to ignore this property, use the 'setIsOptional(true)' method in the builder.", key)
                }

                let value = inputRow[property.sourceProperty];

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

            destination.push(row);
        }

        return destination;
    }
}