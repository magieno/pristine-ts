/**
 * The event types that we handle from Stripe.
 */
export enum StripeEventTypeEnum {
    /**
     * When a subscription was created.
     */
    StripeSubscriptionCreated = "STRIPE_SUBSCRIPTION_CREATED",

    /**
     * When a subscription was updated.
     */
    StripeSubscriptionUpdated = "STRIPE_SUBSCRIPTION_UPDATED",

    /**
     * When a subscription was deleted.
     */
    StripeSubscriptionDeleted = "STRIPE_SUBSCRIPTION_DELETED",
}
