import {ResolverInterface} from "@pristine-ts/common";
import {ConfigurationResolverError} from "../errors/configuration-resolver.error";

/**
 * This class takes the name of the environment variable and returns the value.
 */
export class EnvironmentVariableResolver implements ResolverInterface<string> {
    public constructor(private readonly environmentVariableName: string) {
    }

    /**
     * Resolves the value of the environment variable.
     */
    async resolve(): Promise<string> {
        if(process.env[this.environmentVariableName] === undefined) {
            throw new ConfigurationResolverError("Cannot find the environment variable.", this.environmentVariableName);
        }

        return Promise.resolve(process.env[this.environmentVariableName] as string);
    }
}
