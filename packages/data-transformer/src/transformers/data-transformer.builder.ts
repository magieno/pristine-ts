import {injectable} from "tsyringe";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataNormalizerAlreadyAdded} from "../errors/data-normalizer-already-added.error";
import {DataTransformerProperty} from "./data-transformer.property";
import {moduleScoped} from "@pristine-ts/common";
import {DataTransformerModuleKeyname} from "../data-transformer.module.keyname";

@moduleScoped(DataTransformerModuleKeyname)
@injectable()
export class DataTransformerBuilder {
    public normalizers: { [id in DataNormalizerUniqueKey]: { options: any}} = {};

    public destination: any;

    public properties: {[sourceProperty in string]: DataTransformerProperty} = {}

    public addNormalizer(normalizerUniqueKey: string, options?: any): DataTransformerBuilder {
        if(this.normalizers[normalizerUniqueKey] !== undefined) {
            throw new DataNormalizerAlreadyAdded("The data normalizer '" + normalizerUniqueKey + "' has already been added to this builder.", normalizerUniqueKey, options);
        }

        this.normalizers[normalizerUniqueKey] = {
            options,
        };
        return this;
    }

    public setDestination(destination: any): DataTransformerBuilder {
        this.destination = destination;

        return this;
    }

    public add() {
        return new DataTransformerProperty(this);
    }

    public addNewProperty(property: DataTransformerProperty) {
        this.properties[property.sourceProperty] = property;
    }
}
