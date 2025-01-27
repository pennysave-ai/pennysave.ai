"use client";

import React from "react";
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
}

const SimplePlaidLink = ({
  title,
  startContent = null,
  className,
  plaidItemId,
  variant,
}: SimplePlaidLinkProps) => {
  const { data, isLoading: isLinkTokensLoading } = useGetLinkTokens();
  const updatePlaidItem = useUpdatePlaidItem();
  const token = plaidItemId
    ? data?.update.filter(({ id }: { id: string }) => id === plaidItemId)[0]
        ?.token
    : data?.createToken;
  const { open, ready } = usePlaidLink({
    token,
    onSuccess: (puplicToken, meta) => {
      // if there is a public token, means that we are updating the plaid item
      if (puplicToken) {
        console.log("mutating....");
        updatePlaidItem.mutateAsync(puplicToken);
      }
      // console.log("puplicToken", puplicToken);
      // console.log("meta", meta);
    },
    // onEvent
    // onExit
  });

  const isLoading = !ready || isLinkTokensLoading;

  return (
    <Button
      isIconOnly={!!plaidItemId}
      className={className}
      size={!!plaidItemId ? "sm" : "md"}
      variant={!!plaidItemId ? variant ?? "light" : "solid"}
      onPress={() => {
        if (ready) {
          open();
        }
      }}
      isDisabled={isLoading}
      color="primary"
      type="button"
      startContent={!isLoading && startContent}
    >
      {plaidItemId ? (
        isLoading ? (
          <Loader />
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
