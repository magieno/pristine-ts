import {injectable, injectAll} from "tsyringe";
import {tag} from "@pristine-ts/common";
import {DataTransformerModuleKeyname} from "../data-transformer.module.keyname";
import {DataNormalizer} from "../interfaces/data-normalizer.interface";
import {DataTransformerBuilder} from "./data-transformer.builder";
import {DataTransformerProperty} from "./data-transformer.property";
import {DataTransformerSourcePropertyNotFoundError} from "../errors/data-transformer-source-property-not-found.error";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";

@tag(DataTransformerModuleKeyname)
@injectable()
export class DataTransformer {
    private readonly dataNormalizersMap: { [key in DataNormalizerUniqueKey]: DataNormalizer<any, any>} = {}

    public constructor(@injectAll("DataNormalizerInterface") private readonly dataNormalizers: DataNormalizer<any, any>[]) {
        dataNormalizers.forEach(dataNormalizer => {
            this.dataNormalizersMap[dataNormalizer.getUniqueKey()] = dataNormalizer;
        })
    }

    public transform(builder: DataTransformerBuilder, source: any, destination: any) {
        const globalNormalizers = builder.normalizers;

        // Loop over the properties defined in the builder
        for (let key in builder.properties) {
            if(builder.properties.hasOwnProperty(key) === false) {
                continue;
            }

            const property: DataTransformerProperty = builder.properties[key];
            if(source.hasOwnProperty(property.sourceProperty) === false) {
                if(property.isOptional) {
                    continue;
                }

                throw new DataTransformerSourcePropertyNotFoundError("The property '" + key + "' isn't found in the Source object and isn't marked as Optional. If you want to ignore this property, use the 'setIsOptional(true)' method in the builder.", key)
            }

            let value = source[property.sourceProperty];

            const normalizers = globalNormalizers.filter(element => property.excludedNormalizers.has(element.key) === false);
            normalizers.push(...property.normalizers);

            normalizers.forEach(element => {
                const dataNormalizer = this.dataNormalizersMap[element.key];
                value = dataNormalizer.normalize(value, element.options);
            })

            // Assign the resulting value in the destination
            destination[property.destinationProperty] = value;
        }

        return destination;
    }
}