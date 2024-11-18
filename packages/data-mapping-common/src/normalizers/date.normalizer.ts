import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";
import {DateNormalizerOptions} from "../normalizer-options/date-normalizer.options";
import {TypeEnum, TypeUtils} from "@pristine-ts/metadata";
import {BaseNormalizer} from "./base.normalizer";

export class DateNormalizer extends BaseNormalizer<DateNormalizerOptions> implements DataNormalizerInterface<Date | undefined, DateNormalizerOptions> {
    getUniqueKey(): string {
        return "PRISTINE_DATE_NORMALIZER";
    }

    normalize(source: any, options?: DateNormalizerOptions): Date | undefined {
        const typeEnum = TypeUtils.getTypeOfValue(source);

        options = this.getOptions(options);

        if (typeEnum === undefined) {
            if (options?.returnUndefinedOnInvalidDate === false) {
                return new Date();
            }

            return undefined;
        }

        let date: Date;

        switch (typeEnum) {
            case TypeEnum.Date:
                if(!isNaN(source.getTime())) {
                    return source;
                }

            case TypeEnum.Number:
                if(options?.treatNumbers === "seconds") {
                    source = source * 1000;
                }
                // We don't break here because the behaviour is that same as with a string.

            case TypeEnum.String:
                date = new Date(source);

                if(!isNaN(date.getTime())) {
                    return date;
                }

                break;

            case TypeEnum.Object:
                date = new Date();

                // todo: Allow this property to be customizable in the options eventually
                if(source.hasOwnProperty("year")) {
                    date.setFullYear(source["year"]);
                }
                if(source.hasOwnProperty("month")) {
                    date.setMonth(source["month"]);
                }
                if(source.hasOwnProperty("day")) {
                    date.setDate(source["day"]);
                }
                if(source.hasOwnProperty("hours")) {
                    date.setHours(source["hours"]);
                }
                if(source.hasOwnProperty("minutes")) {
                    date.setMinutes(source["minutes"]);
                }
                if(source.hasOwnProperty("seconds")) {
                    date.setSeconds(source["seconds"]);
                }

                if(!isNaN(date.getTime())) {
                    return date;
                }

                break;
        }

        if (options?.returnUndefinedOnInvalidDate === false) {
            return new Date();
        }

        return undefined;
    }

}