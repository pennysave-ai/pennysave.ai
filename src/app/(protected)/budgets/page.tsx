"use server";
import { auth } from "@/auth";
import { Hero } from "@/components/common";
import BudgetsWrapper from "./budgets-wrapper";

export default async function BudgetsPage() {
  const session = await auth();
  if (!session) {
    return null;
  }
  return (
    <>
      <div className="relative z-10 flex flex-col w-full">
        <Hero description="Add, edit or delete your budgets" />
        <BudgetsWrapper
          hasActiveSubscription={!!session?.user?.hasActiveStripeSubscription}
        />
      </div>
    </>
  );
}
