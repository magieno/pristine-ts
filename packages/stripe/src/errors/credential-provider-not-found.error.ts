import {HttpError} from "@pristine-ts/networking";
import {StripeModuleKeyname} from "../stripe.module.keyname";

/**
 * This Error represents an error when there are no credentials providers registered with the Credential Provider Unique Name configuration.
 */
export class CredentialProviderNotFoundError extends HttpError {
    public constructor(readonly uniqueName: string, readonly errors?: any[] | undefined) {
        super(500, `There is no credential provier registered with the configuration name '${StripeModuleKeyname}.credential_provider.name' with unique name: '${uniqueName}'.`, errors);

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, CredentialProviderNotFoundError.prototype);
    }
}
