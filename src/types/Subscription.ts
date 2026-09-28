/**
 * Apple subscription status, as stored in User.appleSubscriptionStatus and
 * signed into the mobile access token's `subscription.status` claim.
 *
 * Lives here rather than alongside the token code so the data layer can
 * reference it without depending on an HTTP route module.
 */
export enum SubscriptionStatus {
  Active = "active",
  Trial = "trial",
  ActiveUntilExpiration = "active_until_expiration",
  PastDue = "past_due",
  GracePeriod = "grace_period",
  Inactive = "inactive",
  Canceled = "canceled",
  /** Ran out after a billing failure, as opposed to the user cancelling. */
  Expired = "expired",
  GracePeriodExpired = "grace_period_expired",
}

/** The string values of SubscriptionStatus, as they appear in a signed token. */
export type SubscriptionStatusValue = `${SubscriptionStatus}`;
