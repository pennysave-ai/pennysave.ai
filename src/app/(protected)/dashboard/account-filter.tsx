"use client";

import { Select, SelectItem } from "@nextui-org/select";
import { useGetAccounts } from "@/features/accounts/hooks";
import { Icon } from "@iconify/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function AccountFilter() {
  const { data, isLoading } = useGetAccounts();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId") || "all";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const currencyId = searchParams.get("currencyId") || "";

  const onChange = (accountId: string) => {
    const query = new URLSearchParams(searchParams);
    if (accountId) {
      query.set("accountId", accountId);
    }
    if (accountId === "all") {
      query.delete("accountId");
    }
    if (currencyId) {
      query.delete("currencyId");
    }
    if (from) {
      query.set("from", from);
    }
    if (to) {
      query.set("to", to);
    }
    router.push(`${pathname}?${query.toString()}`);
  };

  return (
    <Select
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
        {data?.data
          .map(({ id, name, currency: { name: currencyName } }) => ({
            key: id,
            label: `${name} (${currencyName})`,
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
