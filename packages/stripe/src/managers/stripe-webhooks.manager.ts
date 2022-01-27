import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import Stripe from "stripe";
import {Event, EventDispatcher} from "@pristine-ts/core";
import {StripeEventTypeEnum} from "../enums/stripe-event-type.enum";
import {StripeClient} from "../clients/stripe.client";
import {StripeModuleKeyname} from "../stripe.module.keyname";
import {Request} from "@pristine-ts/common";

@injectable()
export class StripeWebhooksManager {
    constructor(
        private readonly eventDispatcher: EventDispatcher,
        private readonly stripeClient: StripeClient,
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    ) {}

    /**
     * Verifies the signature and dispatches an event based on the webhook request received from Stripe.
     * @param request
     * @param stripeSigningEndpointSecret
     */
    async emitSubscriptionEvent(request: Request, stripeSigningEndpointSecret: string): Promise<void> {
        const event = await this.stripeClient.verifySignature(request, stripeSigningEndpointSecret);

        if(!event.type.startsWith('customer.subscription')) {
            this.logHandler.error("Stripe event is not a subscription", {event, className: StripeWebhooksManager.name}, StripeModuleKeyname);
            throw new Error("Event is not a subscription");
        }

        const stripeSubscription: Stripe.Subscription = event.data.object as Stripe.Subscription;

        let type!: StripeEventTypeEnum;

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
            default:
                await this.logHandler.debug("This event type is not supported", {event, className: StripeWebhooksManager.name}, StripeModuleKeyname);
                return Promise.resolve();
        }

        const parsedEvent = new Event(type!, stripeSubscription)

        await this.eventDispatcher.dispatch(parsedEvent)
    }
}
