import { Hero } from "@/components/common";
import TransactionsCard from "./transactions-card";

export default async function TransactionsPage() {
  return (
    <div className="relative z-10 flex flex-col w-full">
      <Hero description="Add, edit or delete your transactions" />
      <TransactionsCard />
    </div>
  );
}
