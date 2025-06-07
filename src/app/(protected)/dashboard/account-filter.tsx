"use client";

import { Select, SelectItem } from "@heroui/select";
import { Icon } from "@iconify/react";

export default function AccountFilter({
  isLoading,
  onChange,
  accountId,
  data,
}: {
  isLoading: boolean;
  onChange: (accountId: string) => void;
  accountId: string;
  data: { id: string; name: string; currency: string }[] | undefined;
}) {
  return (
    <Select
      disallowEmptySelection
      label="Account"
      isLoading={isLoading}
      disabled={isLoading}
      selectedKeys={[accountId]}
      startContent={<Icon icon="solar:wallet-money-outline" />}
      onChange={({ target }) => onChange(target.value)}
    >
      <>
        <SelectItem key="all" className="capitalize">
          All Accounts
        </SelectItem>
        {data
          ?.map(({ id, name, currency }) => ({
            key: id,
            label: `${name} (${currency})`,
          }))
          .map((animal) => (
            <SelectItem className="capitalize" key={animal.key}>
              {animal.label}
            </SelectItem>
          ))}
      </>
    </Select>
  );
}
