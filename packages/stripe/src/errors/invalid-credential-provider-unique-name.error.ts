import {HttpError} from "@pristine-ts/networking";
import {StripeModuleKeyname} from "../stripe.module.keyname";

/**
 * This Error represents an error when the Credential Provider Unique Name provided in the configuration contains an invalid value..
 */
export class InvalidCredentialProviderUniqueNameError extends HttpError {
    public constructor(readonly uniqueName: string, readonly errors?: any[] | undefined) {
        super(500, `The configuration '${StripeModuleKeyname}.credential_provider.name' contains an invalid unique name: '${uniqueName}'.`, errors);

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, InvalidCredentialProviderUniqueNameError.prototype);
    }
}
