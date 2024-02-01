import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";
import {injectable} from "tsyringe";
import {TypeEnum, TypeUtils} from "@pristine-ts/metadata";
import {StringNormalizerOptions} from "../normalizer-options/string-normalizer.options";
import {format} from "date-fns";

@injectable()
export class StringNormalizer implements DataNormalizerInterface<string | undefined, StringNormalizerOptions> {
    getUniqueKey(): string {
        return StringNormalizer.name;
    }

    normalize(source: any, options?: StringNormalizerOptions): string | undefined {
        const typeEnum = TypeUtils.getTypeOfValue(source);

        if (typeEnum === undefined || typeEnum === TypeEnum.Null) {
            if (options?.ignoreUndefined === false) {
                return "";
            }

            return undefined;
        }

        switch (typeEnum) {
            case TypeEnum.String:
                return source;

            case TypeEnum.Number:
                return "" + source;

            case TypeEnum.Boolean:
                return source ? "true" : "false";

            case TypeEnum.Date:
                if (options?.dateFormat) {
                    return format(source, options.dateFormat);
                }

                // This will return the default format we want: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toJSON
                return (source as Date).toJSON();

            case TypeEnum.Array:
                return source.map( (item: any) => this.normalize(item, options));

            case TypeEnum.Symbol:
            case TypeEnum.Object:
                if(typeof source.toString === "function") {
                    return source.toString();
                }

                try {
                    return JSON.stringify(source);
                } catch (e) {
                    return "" + source
                }

                // For now, let's do that for other types. We can make it better eventually.
            default:
                return "" + source;
        }
    }
}