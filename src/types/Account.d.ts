import { Currency } from "./Currency";
import { Institution } from "./Institution";
import { User } from "./User";

export type Account = {
  id: string;
  name: string;
  currency: Currency;
  institution: Institution;
  users: User[];
  /**
   * Set only for a member of an account whose owner's subscription has
   * lapsed, and only when the caller asked for paused accounts. Sharing is
   * the owner's plan, so the account pauses for its members rather than
   * disappearing. `pausedAt` is when the owner's subscription ended, if known.
   */
  paused?: true;
  pausedAt?: Date | null;
};
