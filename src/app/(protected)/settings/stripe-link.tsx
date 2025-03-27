import React from "react";
import { useStripe } from "@stripe/react-stripe-js";

import { Button } from "@heroui/button";
import { Loader } from "@/app/icons";
import { useGetStripeToken } from "@/features/stripe/hooks";
import { useGetAccounts } from "@/features/accounts/hooks";
import { useGetEntities } from "@/features/entities/hooks";

interface StripeLinkProps {
  title?: string;
  startContent?: React.ReactNode | null;
  className?: string;
  hasActiveSubscription: boolean;
  openPaywall: () => void;
}

const StripeLink = ({
  title,
  startContent = null,
  className,
  hasActiveSubscription,
  openPaywall,
}: StripeLinkProps) => {
  const { isFetching, refetch } = useGetStripeToken();
  const { refetch: updateEntities } = useGetEntities();
  const { refetch: updateAccounts } = useGetAccounts();
  const stripe = useStripe();

  const handlePress = async () => {
    if (!hasActiveSubscription) {
      openPaywall();
      return;
    }
    try {
      const { data } = await refetch();
      const result = await stripe?.collectFinancialConnectionsAccounts({
        clientSecret: data?.sessionToken,
      });
      if (result?.financialConnectionsSession) {
        updateEntities();
        updateAccounts();
      }
    } catch (e) {
      console.log("Error getting stripe token", e);
    }
  };
  return (
    <Button
      as="a"
      className={className}
      onPress={handlePress}
      isDisabled={isFetching}
      color="primary"
      type="button"
      startContent={!isFetching && startContent}
    >
      {isFetching ? <Loader /> : title}
    </Button>
  );
};
export default StripeLink;
