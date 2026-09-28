import { User } from "./User";
import { Account } from "./Account";
import { Category } from "./Category";

export type Transaction = {
  id: string;
  amount: number;
  payee: string;
  notes: string | null;
  createdAt: Date;
  createdByUser: User;
  account: Account;
  /** The viewer's category this row counts under, or null when it has none or is an unmapped partner row. */
  category: Category | null;
  /** The category the author picked. Equals `category` on the viewer's own rows. */
  sourceCategory?: Category | null;
  /**
   * Any member can file this row: the author changes it, anyone else files it
   * for themselves only. Sent so the app can tell this server from one that
   * refuses everyone but the author.
   */
  canFile?: boolean;
};

export type NewTransaction = {
  amount: number;
  payee?: string;
  notes?: string;
  accountId: string;
  categoryId?: string | null;
  createdAt: string;
};
