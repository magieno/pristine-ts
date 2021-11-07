let environmentVariables: {[key: string]:string | undefined} | undefined = undefined;

export class ConfigurationUtils {
    static getEnvironmentVariablesMemoized(): {[key: string]:string | undefined} {
        if(environmentVariables) {
            return environmentVariables;
        }

        environmentVariables = process.env;

        return environmentVariables!;
    }
}