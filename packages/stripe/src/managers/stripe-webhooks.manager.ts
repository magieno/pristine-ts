import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import Stripe from "stripe";
import {Event, EventDispatcher} from "@pristine-ts/core";
import {StripeEventTypeEnum} from "../enums/stripe-event-type.enum";
import {StripeClient} from "../clients/stripe.client";
import {StripeModuleKeyname} from "../stripe.module.keyname";
import {Request} from "@pristine-ts/common";

/**
 * The StripeWebhooksManager handles webhooks calls from Stripe and transforms those into Pristine Events.
 */
@injectable()
export class StripeWebhooksManager {

    /**
     * The StripeWebhooksManager handles webhooks calls from Stripe and transforms those into Pristine Events.
     * @param eventDispatcher The event dispatcher to dispatch Pristine Events once webhook calls from Stripe are parsed.
     * @param stripeClient The Stripe client.
     * @param logHandler The log handler to output logs.
     */
    constructor(
        private readonly eventDispatcher: EventDispatcher,
        private readonly stripeClient: StripeClient,
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    ) {}

    /**
     * Verifies the signature and dispatches an event based on the webhook request received from Stripe.
     * @param request The webhook request received from Stripe
     * @param stripeSigningEndpointSecret The Stripe signing endpoint secret with which the webhook request is signed.
     */
    async emitSubscriptionEvent(request: Request, stripeSigningEndpointSecret: string): Promise<void> {
        // Verify the signature of the stripe webhook request.
        const event = await this.stripeClient.verifySignature(request, stripeSigningEndpointSecret);

        // For the moment we only handle subscription events.
        if(!event.type.startsWith('customer.subscription')) {
            this.logHandler.error("StripeWebhooksManager: Stripe event is not a subscription, make sure to only send subscription events to this webhook.", {
                highlights: {
                    stripeEventId: event.id,
                    requestUrl: `${request.httpMethod} ${request.url}`,
                },
                extra: {
                    className: StripeWebhooksManager.name,
                    request,
                    event,
                }
            }, StripeModuleKeyname);
            throw new Error("Event is not a subscription");
        }

        const stripeSubscription: Stripe.Subscription = event.data.object as Stripe.Subscription;

        let type!: StripeEventTypeEnum;

        // Create the appropriate event type
        switch (event.type) {
            case "customer.subscription.created":
                type = StripeEventTypeEnum.StripeSubscriptionCreated
                break;
            case "customer.subscription.updated":
                type = StripeEventTypeEnum.StripeSubscriptionUpdated
                break;
            case "customer.subscription.deleted":
                type = StripeEventTypeEnum.StripeSubscriptionDeleted
                break;
            case "customer.subscription.resumed":
                type = StripeEventTypeEnum.StripeSubscriptionResumed
                break;
            case "customer.subscription.paused":
                type = StripeEventTypeEnum.StripeSubscriptionPaused
                break;
            case "customer.subscription.trial_will_end":
                type = StripeEventTypeEnum.StripeSubscriptionTrialWillEnd
                break;
            case "customer.subscription.pending_update_applied":
                type = StripeEventTypeEnum.StripeSubscriptionPendingUpdateApplied
                break;
            case "customer.subscription.pending_update_expired":
                type = StripeEventTypeEnum.StripeSubscriptionPendingUpdateExpired
                break;
            default:
                await this.logHandler.debug("StripeWebhooksManager: This event type is not supported.", {
                  highlights: {
                    stripeEventId: event.id,
                    requestUrl: `${request.httpMethod} ${request.url}`,
                  },
                  extra: {
                    className: StripeWebhooksManager.name,
                    request,
                    event,
                  }
                }, StripeModuleKeyname);
                return Promise.resolve();
        }


        // Because we check before and resolve before getting here.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const parsedEvent = new Event(type!, stripeSubscription)

        // Dispatch the event.
        await this.eventDispatcher.dispatch(parsedEvent)
    }
}
