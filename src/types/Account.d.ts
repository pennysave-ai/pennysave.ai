import { Currency } from "./Currency";
import { Institution } from "./Institution";
import { User } from "./User";

export type Account = {
  id: string;
  name: string;
  currency: Currency;
  institution: Institution;
  users: User[];
};
