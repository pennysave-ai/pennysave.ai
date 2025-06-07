"use client";

import { Icon } from "@iconify/react";
import { Select, SelectItem } from "@heroui/select";

export default function BaseCurrencyFilter({
  currencyId,
  accountId,
  onChange,
  isLoading,
  data,
}: {
  currencyId: string;
  accountId: string;
  onChange: (currencyId: string) => void;
  isLoading: boolean;
  data: { id: string; name: string }[] | undefined;
}) {
  return (
    <Select
      className="max-w-[120px]"
      isDisabled={accountId !== "all" || isLoading}
      isLoading={isLoading}
      label="Show in"
      disallowEmptySelection
      startContent={<Icon icon="solar:dollar-outline" />}
      onChange={({ target }) => onChange(target.value)}
      selectedKeys={[currencyId]}
    >
      <>
        {data?.map(({ id, name }) => (
          <SelectItem key={id}>{name}</SelectItem>
        ))}
      </>
    </Select>
  );
}
