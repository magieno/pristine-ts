import {injectable} from "tsyringe";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataNormalizerAlreadyAdded} from "../errors/data-normalizer-already-added.error";
import {DataTransformerProperty} from "./data-transformer.property";
import {moduleScoped} from "@pristine-ts/common";
import {DataTransformerModuleKeyname} from "../data-transformer.module.keyname";
import {DataTransformerInterceptorUniqueKeyType} from "../types/data-transformer-interceptor-unique-key.type";
import {
    DataAfterRowTransformerInterceptorAlreadyAddedError
} from "../errors/data-after-row-transformer-interceptor-already-added.error";
import {
    DataBeforeRowTransformerInterceptorAlreadyAddedError
} from "../errors/data-before-row-transformer-interceptor-already-added.error";

@moduleScoped(DataTransformerModuleKeyname)
@injectable()
export class DataTransformerBuilder {
    public normalizers: { key: DataNormalizerUniqueKey, options: any}[] = [];
    public beforeRowTransformInterceptors: { key: DataTransformerInterceptorUniqueKeyType, options: any}[] = [];
    public afterRowTransformInterceptors: { key: DataTransformerInterceptorUniqueKeyType, options: any}[] = [];

    public properties: {[sourceProperty in string]: DataTransformerProperty} = {}

    public addNormalizer(normalizerUniqueKey: DataNormalizerUniqueKey, options?: any): DataTransformerBuilder {
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

    public addBeforeRowTransformInterceptor(key: DataTransformerInterceptorUniqueKeyType, options?: any): DataTransformerBuilder {
        if(this.hasBeforeRowTransformInterceptor(key)) {
            throw new DataBeforeRowTransformerInterceptorAlreadyAddedError("The before row transform interceptor has already been added to this builder.", key, options)
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

    public addAfterRowTransformInterceptor(key: DataTransformerInterceptorUniqueKeyType, options?: any): DataTransformerBuilder {
        if(this.hasAfterRowTransformInterceptor(key)) {
            throw new DataAfterRowTransformerInterceptorAlreadyAddedError("The after row transform interceptor has already been added to this builder.", key, options)
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
        return new DataTransformerProperty(this);
    }

    public addNewProperty(property: DataTransformerProperty) {
        this.properties[property.sourceProperty] = property;
    }

    public import(jsonString: string) {
        const object = JSON.parse(jsonString);

        if(object.hasOwnProperty("normalizers") && Array.isArray(object.normalizers)) {
            this.normalizers = object.normalizers;
        }

        if(object.hasOwnProperty("beforeRowTransformInterceptors") && Array.isArray(object.beforeRowTransformInterceptors)) {
            this.beforeRowTransformInterceptors = object.beforeRowTransformInterceptors;
        }

        if(object.hasOwnProperty("afterRowTransformInterceptors") && Array.isArray(object.afterRowTransformInterceptors)) {
            this.afterRowTransformInterceptors = object.afterRowTransformInterceptors;
        }

        if(object.hasOwnProperty("properties") && typeof object.properties === "object") {
            for(const key in object.properties) {
                if(object.properties.hasOwnProperty(key) === false) {
                    continue;
                }

                const property = object.properties[key];
                const newProperty = this.add();

                newProperty.normalizers = property.normalizers;
                if(property.hasOwnProperty("excludedNormalizers")) {
                    for(const item in property.excludedNormalizers) {
                        newProperty.excludeNormalizer(item);
                    }
                }

                newProperty.isOptional = property.isOptional;
                newProperty.sourceProperty = property.sourceProperty;
                newProperty.destinationProperty = property.destinationProperty;

                newProperty.end();
            }
        }

        return this;
    }

    public export(): string {
        const properties: any = {};

        for (const key in this.properties) {
            if(this.properties.hasOwnProperty(key) === false) {
                continue;
            }

            const property = this.properties[key];

            const excludedNormalizers: any = {}

            for(const element of property.excludedNormalizers.values()) {
                excludedNormalizers[element] = true;
            }

            properties[key] = {
                "sourceProperty": property.sourceProperty,
                "destinationProperty": property.destinationProperty,
                "isOptional": property.isOptional,
                "normalizers": property.normalizers,
                "excludedNormalizers": excludedNormalizers,
            };
        }

        return JSON.stringify({
            "normalizers": this.normalizers,
            "beforeRowTransformInterceptors": this.beforeRowTransformInterceptors,
            "afterRowTransformInterceptors": this.afterRowTransformInterceptors,
            "properties": properties,
        });
    }
}
