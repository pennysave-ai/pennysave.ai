import { Hero } from "@/components/common";
import AccountsCard from "./accounts-card";

export default async function AccountsPage() {
  return (
    <>
      <div className="relative z-10 flex flex-col w-full">
        <Hero description="Add, edit or delete your accounts" />
        <div className="flex px-4 w-full justify-center">
          <AccountsCard />
        </div>
      </div>
    </>
  );
}
