import { Hero } from "@/components/common";
import Budgets from "./budgets";

export default async function BudgetsPage() {
  return (
    <>
      <div className="relative z-10 flex flex-col w-full">
        <Hero description="Add, edit or delete your budgets" />
        <Budgets />
      </div>
    </>
  );
}
