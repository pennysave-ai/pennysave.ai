import { useQuery } from "@tanstack/react-query";
import type { Currency } from "@prisma/client";

export type CurrencyItem = Omit<Currency, "code">;

export const useGetCurrencies = () => {
  const query = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const response = await fetch("/api/currencies");
      if (!response.ok) {
        throw new Error("Failed to fetch currencies");
      }
      const { data } = await response.json();
      return { data } as { data: CurrencyItem[] };
    },
    refetchOnWindowFocus: false,
  });
  return query;
};
