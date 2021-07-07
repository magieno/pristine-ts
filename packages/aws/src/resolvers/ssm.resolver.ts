import {ResolverInterface} from "@pristine-ts/common";
import {SSM, GetParameterRequest} from "@aws-sdk/client-ssm";
import {SSMResolverError} from "../errors/ssm-resolver.error";

export class SSMResolver implements ResolverInterface<string> {
    public constructor(private readonly ssmParameterName: string, private readonly region: string, private readonly isSecure: boolean = false) { }

    async resolve(): Promise<string> {
        const ssm: SSM = new SSM({apiVersion: 'latest', region: this.region});
        const params: GetParameterRequest = {
            Name: this.ssmParameterName,
            WithDecryption: this.isSecure,
        }
        try {
            const parameterOutput = await ssm.getParameter(params);
            if(!parameterOutput.Parameter?.Value) {
                throw new SSMResolverError("No value for this parameter.", this.ssmParameterName);
            }
            return Promise.resolve(parameterOutput.Parameter?.Value as string);

        } catch (e) {
            throw new SSMResolverError("Error getting parameter from SSM.", this.ssmParameterName, e);
        }
    }
}
