import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";
import {injectable} from "tsyringe";

@injectable()
export class StringNormalizer implements DataNormalizerInterface<string, any>{
    getUniqueKey(): string {
        return StringNormalizer.name;
    }

    normalize(source: any, options?: any): string {
        // todo: check if array

        // todo: check if object

        // todo: check if Set

        // todo: check if Set

        if(typeof source === "string")

        return source + "";
    }
}