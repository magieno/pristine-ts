import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import Stripe from "stripe";
import {Event, EventDispatcher} from "@pristine-ts/event";
import {StripeEventTypeEnum} from "../enums/stripe-event-type.enum";
import {RequestInterface} from "@pristine-ts/common";
import {StripeClient} from "../clients/stripe.client";

@injectable()
export class StripeWebhooksManager {
    constructor(
        private readonly eventDispatcher: EventDispatcher,
        private readonly stripeClient: StripeClient,
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    ) {}

    async emitSubscriptionEvent(request: RequestInterface, stripeSigningEndpointSecret: string): Promise<void> {
        const event = await this.stripeClient.verifySignature(request, stripeSigningEndpointSecret);

        if(!event.type.startsWith('customer.subscription')) {
            this.logHandler.error("Stripe event is not a subscription", {event, className: StripeWebhooksManager.name});
            throw new Error("Event is not a subscription");
        }

        const stripeSubscription: Stripe.Subscription = event.data.object as Stripe.Subscription;
        const parsedEvent = new Event();
        parsedEvent.payload = stripeSubscription;
        switch (event.type) {
            case "customer.subscription.created":
                parsedEvent.type = StripeEventTypeEnum.StripeSubscriptionCreated
                break;
            case "customer.subscription.updated":
                parsedEvent.type = StripeEventTypeEnum.StripeSubscriptionUpdated
                break;
            case "customer.subscription.deleted":
                parsedEvent.type = StripeEventTypeEnum.StripeSubscriptionDeleted
                break;
            default:
                await this.logHandler.debug("This event type is not supported", {event, className: StripeWebhooksManager.name});
                break;
        }

        await this.eventDispatcher.dispatch(parsedEvent)
    }
}
