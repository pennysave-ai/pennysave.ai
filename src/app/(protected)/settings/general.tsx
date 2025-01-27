"use client";

import { Session } from "next-auth";
import { CardHeader } from "@heroui/card";
import BanksSection from "./banks-section";
import SubscriptionSection from "./subscription-section";
import { useGetPlaidItems } from "@/features/plaidItems/hooks";

interface GeneralProps {
  user: Session["user"];
}

// TODO: Add currency support
export default function General({ user }: GeneralProps) {
  const { data: banks, isLoading: banksLoading } = useGetPlaidItems();
  return (
    <>
      <CardHeader className="flex flex-col items-start p-4">
        <p className="text-large">General Settings</p>
        <p className="text-small text-default-500">Manage your data</p>
      </CardHeader>
      <div className="grid grid-col-1 gap-y-3 px-3">
        <SubscriptionSection />
        <BanksSection
          isLoading={banksLoading}
          banks={banks}
          hasActiveSubscription={user.hasActiveStripeSubscription}
        />
      </div>
    </>
  );
}
