import {ResolverInterface} from "@pristine-ts/common";
import {SSM, GetParameterRequest} from "@aws-sdk/client-ssm";
import {SSMResolverError} from "../errors/ssm-resolver.error";

export class SSMResolver implements ResolverInterface<string> {
    private ssm: SSM;
    public constructor(private readonly ssmParameterName, private readonly isSecure: boolean) {
        this.ssm = new SSM({apiVersion: 'latest'});
    }

    async resolve(): Promise<string> {
        const params: GetParameterRequest = {
            Name: this.ssmParameterName,
            WithDecryption: this.isSecure,
        }
        try {
            const parameterOutput = await this.ssm.getParameter(params);
            if(!parameterOutput.Parameter?.Value) {
                throw new SSMResolverError("No value for this parameter.", this.ssmParameterName);
            }
            return Promise.resolve(parameterOutput.Parameter?.Value as string);

        } catch (e) {
            throw new SSMResolverError("Error getting parameter from SSM.", this.ssmParameterName);
        }
    }
}
