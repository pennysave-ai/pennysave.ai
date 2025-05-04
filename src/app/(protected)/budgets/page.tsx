import { Hero } from "@/components/common";
import BudgetsWrapper from "./budgets-wrapper";

export default async function BudgetsPage() {
  return (
    <>
      <div className="relative z-10 flex flex-col w-full">
        <Hero description="Add, edit or delete your budgets" />
        <BudgetsWrapper />
      </div>
    </>
  );
}
