import {ResolverInterface} from "@pristine-ts/common";
import {ConfigurationResolverError} from "../errors/configuration-resolver.error";

/**
 * This class takes either another resolver or a scalar (boolean, number or string) and returns a boolean value.
 */
export class BooleanResolver implements ResolverInterface<boolean> {
    public constructor(private readonly valueOrResolver: boolean | string | number | ResolverInterface<string> | ResolverInterface<number>) {
    }

    /**
     * This method takes a string and transforms it into a boolean. This is useful in configurations when the system, for example environment variables, only
     * support string but the configuration expects a boolean.
     * @param value
     * @private
     */
    private resolveString(value: string): boolean {
        const normalizedValue = value.toLowerCase();

        if(normalizedValue === "true" || normalizedValue === "1") {
            return true;
        }

        if(normalizedValue === "false" || normalizedValue === "0") {
            return false;
        }

        throw new ConfigurationResolverError("Cannot convert the string to a boolean.", {
            value
        });
    }

    /**
     * This method takes a number and transforms it into a boolean. This is useful when you receive a number but expect
     * a boolean in the end.
     *
     * @param value
     * @private
     */
    private resolveNumber(value: number): boolean {
        if(value === 0) {
            return false;
        }

        if(value === 1) {
            return true;
        }

        throw new ConfigurationResolverError("Cannot convert the number to a boolean.", value);
    }

    /**
     * This method checks the type of the argument and calls the proper individual method.
     *
     * @param value
     * @private
     */
    private async resolveValueOrResolver(value: boolean | string | number | ResolverInterface<string> | ResolverInterface<number>): Promise<boolean> {
        if(typeof value === "boolean") {
            return value;
        }

        if(typeof value === "string") {
            return this.resolveString(value);
        }

        if(typeof value === "number") {
            return this.resolveNumber(value);
        }

        if(typeof value === "object" && typeof value.resolve === "function") {
            return this.resolveValueOrResolver(await value.resolve());
        }

        throw new ConfigurationResolverError("Cannot resolve the value passed. It isn't of type boolean, string, number or ResolverInterface.", {
            value,
        });
    }

    /**
     * This method resolve the value whether it's a scalar or a Resolver.
     */
    async resolve(): Promise<boolean> {
        return this.resolveValueOrResolver(this.valueOrResolver);
    }

}
