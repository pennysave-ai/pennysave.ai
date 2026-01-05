import { User } from "./User";

export type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  owner: User;
};
