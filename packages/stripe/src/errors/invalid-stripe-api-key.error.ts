import {HttpError} from "@pristine-ts/networking";
import {StripeModuleKeyname} from "../stripe.module.keyname";

/**
 * This Error represents an error when the Api Key provided as a configuration value is invalid.
 */
export class InvalidStripeApiKeyError extends HttpError {
    public constructor(readonly stripeApiKey?: string, readonly errors?: any[] | undefined) {
        super(500, `The Stripe API Key registered with the configuration name '${StripeModuleKeyname}.stripeApiKey' contains an invalid value: '${stripeApiKey}'.`, errors);

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, InvalidStripeApiKeyError.prototype);
    }
}
