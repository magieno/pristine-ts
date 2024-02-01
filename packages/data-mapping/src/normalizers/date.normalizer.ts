import {injectable} from "tsyringe";
import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";
import {DateNormalizerOptions} from "../normalizer-options/date-normalizer.options";
import {TypeEnum, TypeUtils} from "@pristine-ts/metadata";

@injectable()
export class DateNormalizer implements DataNormalizerInterface<Date | undefined, DateNormalizerOptions> {
    getUniqueKey(): string {
        return DateNormalizer.name;
    }

    normalize(source: any, options?: DateNormalizerOptions): Date | undefined {
        const typeEnum = TypeUtils.getTypeOfValue(source);

        if (typeEnum === undefined) {
            if (options?.returnUndefinedOnInvalidDate === false) {
                return new Date();
            }

            return undefined;
        }

        let date: Date;

        switch (typeEnum) {
            case TypeEnum.Number:
                if(options?.treatNumbers === "seconds") {
                    source = source * 1000;
                }

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