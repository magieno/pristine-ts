import {ResolverInterface} from "@pristine-ts/common";
import {ConfigurationResolverError} from "../errors/configuration-resolver.error";
import {ConfigurationUtils} from "../utils/configuration.utils";

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
        const environmentVariables = ConfigurationUtils.getEnvironmentVariablesMemoized();

        if(environmentVariables[this.environmentVariableName] === undefined) {
            throw new ConfigurationResolverError("Cannot find the environment variable.", this.environmentVariableName);
        }

        return Promise.resolve(environmentVariables[this.environmentVariableName] as string);
    }
}
