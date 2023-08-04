import {injectable} from "tsyringe";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataNormalizerAlreadyAdded} from "../errors/data-normalizer-already-added.error";
import {DataTransformerProperty} from "./data-transformer.property";
import {moduleScoped} from "@pristine-ts/common";
import {DataTransformerModuleKeyname} from "../data-transformer.module.keyname";

@moduleScoped(DataTransformerModuleKeyname)
@injectable()
export class DataTransformerBuilder {
    public normalizers: { key: DataNormalizerUniqueKey, options: any}[] = [];

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

    public add() {
        return new DataTransformerProperty(this);
    }

    public addNewProperty(property: DataTransformerProperty) {
        this.properties[property.sourceProperty] = property;
    }
}
