import { Hero } from "@/components/common";
import TransactionsCard from "./transactions-card";

export default async function TransactionsPage() {
  return (
    <>
      <div className="relative z-10 flex flex-col w-full">
        <Hero description="Add, edit or delete your transactions" />
        <div className="flex px-4 w-full justify-center">
          <TransactionsCard />
        </div>
      </div>
    </>
  );
}
