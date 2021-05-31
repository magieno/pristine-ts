import {ResolverInterface} from "@pristine-ts/common";
import {ConfigurationResolverError} from "../errors/configuration-resolver.error";

export class EnvironmentVariableResolver implements ResolverInterface<string> {
    public constructor(private readonly environmentVariableName) {
    }

    async resolve(): Promise<string> {
        if(process.env[this.environmentVariableName] === undefined) {
            throw new ConfigurationResolverError("Cannot find the environment variable.", this.environmentVariableName);
        }

        return Promise.resolve(process.env[this.environmentVariableName] as string);
    }
}
