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

    /**
     * When a subscription is paused.
     */
    StripeSubscriptionPaused = "STRIPE_SUBSCRIPTION_PAUSED",

    /**
     * When a subscription is resumed.
     */
    StripeSubscriptionResumed = "STRIPE_SUBSCRIPTION_RESUMED",

    /**
     * When a subscription trial will end.
     */
    StripeSubscriptionTrialWillEnd = "STRIPE_SUBSCRIPTION_TRIAL_WILL_END",

    /**
     * When a subscription pending update has been applied.
     */
    StripeSubscriptionPendingUpdateApplied = "STRIPE_SUBSCRIPTION_PENDING_UPDATE_APPLIED",

    /**
     * When a subscription pending update has been applied.
     */
    StripeSubscriptionPendingUpdateExpired = "STRIPE_SUBSCRIPTION_PENDING_UPDATE_EXPIRED",
}
