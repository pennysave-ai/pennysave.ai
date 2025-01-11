"use client";

import { Icon } from "@iconify/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { useGetCurrencies } from "@/features/currencies/hooks";
import { Select, SelectItem } from "@nextui-org/select";
import { BASE_CURRENCY } from "@/constants";

export default function BaseCurrencyFilter({
  currencyId,
}: {
  currencyId: string;
}) {
  const { data, isLoading } = useGetCurrencies();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const accointId = searchParams.get("accountId");

  const onChange = (currencyId: string) => {
    const query = new URLSearchParams(searchParams);
    if (currencyId) {
      if (currencyId === BASE_CURRENCY) {
        query.delete("currencyId");
      } else {
        query.set("currencyId", currencyId);
      }
    }
    router.push(`${pathname}?${query.toString()}`);
  };
  return (
    <Select
      className="max-w-[120px]"
      isDisabled={!!accointId}
      isLoading={isLoading}
      label="Show in"
      startContent={<Icon icon="solar:dollar-outline" />}
      onChange={({ target }) => onChange(target.value)}
      selectedKeys={[currencyId]}
    >
      <>
        {data?.data.map(({ id, name }) => (
          <SelectItem key={id}>{name}</SelectItem>
        ))}
      </>
    </Select>
  );
}
