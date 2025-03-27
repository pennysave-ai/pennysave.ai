"use client";

import { CardHeader } from "@heroui/card";
import BanksSection from "./banks-section";
import SubscriptionSection from "./subscription-section";
import { useGetAccounts } from "@/features/accounts/hooks";

interface GeneralProps {
  hasActiveSubscription: boolean;
}

export default function General({ hasActiveSubscription }: GeneralProps) {
  const { data: accounts, isFetching: accountsLoading } = useGetAccounts();
  return (
    <>
      <CardHeader className="flex flex-col items-start p-4">
        <p className="text-large">General Settings</p>
        <p className="text-small text-default-500">Manage your data</p>
      </CardHeader>
      <div className="grid grid-col-1 gap-y-3 px-3">
        <SubscriptionSection />
        <BanksSection
          isLoading={accountsLoading}
          accounts={accounts}
          hasActiveSubscription={hasActiveSubscription}
        />
      </div>
    </>
  );
}
