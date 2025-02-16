"use client";

import React, { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/button";
import {
  useGetLinkTokens,
  useUpdatePlaidItem,
} from "@/features/plaidItems/hooks";
import { Loader } from "@/app/icons";

interface SimplePlaidLinkProps {
  title?: string;
  startContent?: React.ReactNode | null;
  className?: string;
  plaidItemId?: string;
  variant?:
    | "light"
    | "solid"
    | "bordered"
    | "flat"
    | "faded"
    | "shadow"
    | "ghost";
  hasActiveSubscription: boolean;
  openPaywall: () => void;
}

const SimplePlaidLink = ({
  title,
  startContent = null,
  className,
  plaidItemId,
  variant,
  hasActiveSubscription,
  openPaywall,
}: SimplePlaidLinkProps) => {
  const [linkToken, setLinkToken] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { refetch } = useGetLinkTokens();
  const updatePlaidItem = useUpdatePlaidItem();
  const config = {
    token: linkToken,
    onSuccess: async (publicToken: string | null) => {
      // If there is a public token, means that we are updating the plaid item
      // Updating acess token in the database for the plaid item
      if (publicToken) {
        setIsLoading(true);
        await updatePlaidItem.mutateAsync(publicToken);
        setIsLoading(false);
      }
    },
    onExit: () => {
      setIsLoading(false);
    },
    onLoad: () => {
      setIsLoading(false);
    },
    onError: () => {
      console.log("Error from plaid link");
    },
  };
  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    if (ready && linkToken) {
      open();
    }
  }, [linkToken, ready, open]);

  const handlePress = async () => {
    if (!hasActiveSubscription) {
      openPaywall();
      return;
    }
    setIsLoading(true);
    const { data } = await refetch();
    const token = plaidItemId
      ? data?.update.filter(({ id }: { id: string }) => id === plaidItemId)[0]
          ?.token
      : data?.createToken;
    setLinkToken(token);
  };

  return (
    <Button
      isIconOnly={!!plaidItemId}
      className={className}
      size={!!plaidItemId ? "sm" : "md"}
      variant={!!plaidItemId ? variant ?? "light" : "solid"}
      onPress={handlePress}
      isDisabled={isLoading}
      color="primary"
      type="button"
      startContent={!isLoading && startContent}
    >
      {plaidItemId ? (
        !isLoading ? (
          <div className="w-10">
            <Loader />
          </div>
        ) : (
          <Icon icon="solar:pen-2-bold" width={22} />
        )
      ) : isLoading ? (
        <Loader />
      ) : (
        title
      )}
    </Button>
  );
};

export default SimplePlaidLink;
