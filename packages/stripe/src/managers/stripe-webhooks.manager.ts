import {inject, injectable} from "tsyringe";
import {LogHandlerInterface} from "@pristine-ts/logging";
import Stripe from "stripe";
import {RequestInterface} from "@pristine-ts/common";
import {StripeModuleKeyname} from "../stripe.module.keyname";
import {StripeAuthenticationError} from "../errors/stripe-authentication.error";
import {Event, EventDispatcher} from "@pristine-ts/event";
import {StripeEventTypeEnum} from "../enums/stripe-event-type.enum";

@injectable()
export class StripeWebhooksManager {
    constructor(
        private readonly eventDispatcher: EventDispatcher,
        @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
        @inject(`%${StripeModuleKeyname}.stripeApiKey%`) private readonly stripeApiKey: string,
        @inject(`%${StripeModuleKeyname}.stripeEndpointSecret%`) private readonly stripeEndpointSecret: string,
    ) {}

    private getStripeClient(): Stripe {
        return new Stripe(this.stripeApiKey, {
            apiVersion: '2020-08-27',
        });
    }

    async verifySignature(request: RequestInterface): Promise<Stripe.Event> {
        if(!request.headers || !request.headers['stripe-signature']) {
            throw new StripeAuthenticationError(400, 'Missing headers for stripe signature');
        }

        const stripeSignature = request.headers['stripe-signature'];

        try {
            return this.getStripeClient().webhooks.constructEvent(request.rawBody, stripeSignature, this.stripeEndpointSecret);
        } catch (err) {
            this.logHandler.error("Error with stripe signature", {error: err, request});
            throw new StripeAuthenticationError(400, 'Raw body does not match stripe signature');
        }
    }

    async emitSubscriptionEvent(event: Stripe.Event): Promise<void> {
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
