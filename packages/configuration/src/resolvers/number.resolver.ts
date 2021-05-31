import {ResolverInterface} from "@pristine-ts/common";
import {ConfigurationResolverError} from "../errors/configuration-resolver.error";

/**
 * This class takes either another resolver or a scalar (boolean, number or string) and returns a number value.
 */
export class NumberResolver implements ResolverInterface<number> {
    public constructor(private readonly valueOrResolver: boolean | string | number | ResolverInterface<string> | ResolverInterface<number> | ResolverInterface<boolean>) {
    }

    /**
     * This method takes a string and transforms it into a number. This is useful in configurations when the system, for example environment variables, only
     * support string but the configuration expects a number.
     * @param value
     * @private
     */
    private resolveString(value: string): number {
        if(isNaN(+value) === false) {
            return +value;
        }

        throw new ConfigurationResolverError("Cannot convert the string to a number.", value);
    }

    /**
     * This method takes a boolean and transforms it into a number. This is useful when you receive a boolean but expect
     * a number in the end.
     *
     * @param value
     * @private
     */
    private resolveBoolean(value: boolean): number {
        if(value === false) {
            return 0;
        }

        if(value === true) {
            return 1;
        }

        throw new ConfigurationResolverError("Cannot convert the number to a boolean.", value);
    }

    /**
     * This method checks the type of the argument and calls the proper individual method.
     *
     * @param value
     * @private
     */
    private async resolveValueOrResolver(value: boolean | string | number | ResolverInterface<string> | ResolverInterface<number> | ResolverInterface<boolean>): Promise<number> {
        if(typeof value === "number") {
            return value;
        }

        if(typeof value === "string") {
            return this.resolveString(value);
        }

        if(typeof value === "boolean") {
            return this.resolveBoolean(value);
        }

        if(typeof value === "object" && typeof value.resolve === "function") {
            return this.resolveValueOrResolver(await value.resolve());
        }

        throw new ConfigurationResolverError("Cannot resolve the value passed. It isn't of type boolean, string, number or ResolverInterface.", value);
    }

    /**
     * This method resolve the value whether it's a scalar or a Resolver.
     */
    async resolve(): Promise<number> {
        return this.resolveValueOrResolver(this.valueOrResolver);
    }

}
