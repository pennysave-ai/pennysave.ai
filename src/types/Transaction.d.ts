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
  category: Category | null;
};

export type NewTransaction = {
  amount: number;
  payee?: string;
  notes?: string;
  accountId: string;
  categoryId?: string | null;
  createdAt: string;
};
