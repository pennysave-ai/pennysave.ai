export enum BroadcastType {
  // STRIPE SUBSCRIPTIONS ACTIONS for web
  BANK_DATA_UPDATED = "BANK_DATA_UPDATED",
  SUBSCRIPTION_CREATED = "SUBSCRIPTION_CREATED",
  SUBSCRIPTION_UPDATED = "SUBSCRIPTION_UPDATED",
  SUBSCRIPTION_DELETED = "SUBSCRIPTION_DELETED",

  // APPLE SUBSCRIPTION ACTIONS for Ios App
  APPLE_SUBSCRIPTION_UPDATED = "APPLE_SUBSCRIPTION_UPDATED",
  OWNERS_APPLE_SUBSCRIPTION_ENDED = "OWNERS_APPLE_SUBSCRIPTION_ENDED",

  // TRANSACTIONS ACTIONS
  TRANSACTION_CREATED = "TRANSACTION_CREATED",
  // `data` is the whole row as that recipient sees it, like CREATED.
  TRANSACTION_UPDATED = "TRANSACTION_UPDATED",
  // `data` is `{ ids }`: nothing about a deleted row differs per viewer.
  TRANSACTION_DELETED = "TRANSACTION_DELETED",

  // ACCOUNT ACTIONS
  // `data` is the account as that recipient's account list would show it:
  // renamed, or someone joined or left. Sent only to those who can see it.
  ACCOUNT_UPDATED = "ACCOUNT_UPDATED",
  // `data` is `{ id }`: the account was deleted, or the recipient left or was
  // removed from it.
  ACCOUNT_REMOVED = "ACCOUNT_REMOVED",
  // `data` is the account marked `paused`, for a member whose owner's
  // subscription has lapsed. Its own type because builds that predate paused
  // accounts would take it for a live one from ACCOUNT_UPDATED; they ignore
  // an unknown type.
  ACCOUNT_PAUSED = "ACCOUNT_PAUSED",

  // CATEGORY ACTIONS
  // A partner's category or one of the viewer's mappings changed, so name
  // matches may have moved: refetch transactions and the mapping list.
  CATEGORY_MAPPINGS_CHANGED = "CATEGORY_MAPPINGS_CHANGED",
}
