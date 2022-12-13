import {ResolverInterface} from "@pristine-ts/common";
import {SSM, GetParameterRequest} from "@aws-sdk/client-ssm";
import {SSMResolverError} from "../errors/ssm-resolver.error";

/**
 * The resolver to resolve a parameter from AWS SSM.
 * Extends the resolver interface with the generic as a string
 */
export class SSMResolver implements ResolverInterface<string> {
    /**
     * The resolver to resolve a parameter from AWS SSM
     * @param ssmParameterName The name of the SSM parameter, or the resolver to get that name.
     * @param region The AWS region in which the SSM parameter needs to be resolved from.
     * @param isSecure If the parameter is secure or not.
     */
    public constructor(private readonly ssmParameterName: string | ResolverInterface<string> , private readonly region: string | ResolverInterface<string> , private readonly isSecure: boolean = false) { }

    /**
     * Resolves a parameter from AWS SSM.
     */
    async resolve(): Promise<string> {
        const ssmParameterName = await this.resolveArgument(this.ssmParameterName);
        const region = await this.resolveArgument(this.region);
        const ssm: SSM = new SSM({apiVersion: 'latest', region, });
        const params: GetParameterRequest = {
            Name: ssmParameterName,
            WithDecryption: this.isSecure,
        }
        try {
            const parameterOutput = await ssm.getParameter(params);
            if(!parameterOutput.Parameter?.Value) {
                throw new SSMResolverError("No value for this parameter.", ssmParameterName);
            }
            return Promise.resolve(parameterOutput.Parameter?.Value as string);

        } catch (e) {
            throw new SSMResolverError("Error getting parameter from SSM.", ssmParameterName, e);
        }
    }

    /**
     * Resolve the string value of an argument.
     * @param value The value to be resolved (either already a string or another resolver).
     * @private
     */
    private async resolveArgument(value: string | ResolverInterface<string> ): Promise<string> {
        if(typeof value === "string") {
            return value;
        }

        if(typeof value === "object" && typeof value.resolve === "function") {
            return this.resolveArgument(await value.resolve());
        }

        throw new SSMResolverError("Cannot resolve the value passed. It isn't of type string or ResolverInterface.", {
            value,
        });
    }
}
