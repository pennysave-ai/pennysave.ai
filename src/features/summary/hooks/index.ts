import { convertAmountFromMilliunits } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

import { useSearchParams } from "next/navigation";

export type Summary = {
  remainingAmount: number;
  remainingChange: number;
  incomeAmount: number;
  incomeChange: number;
  expensesAmount: number;
  expensesChange: number;
  categories: {
    id: string;
    name: string;
    totalSpending: number;
  }[];
  days: {
    date: string;
    income: number;
    expences: number;
  }[];
};

export const useGetSummary = () => {
  const params = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const accountId = params.get("accountId") || "";
  const queryParams = new URLSearchParams();

  if (from) queryParams.append("from", from);
  if (to) queryParams.append("to", to);
  if (accountId) queryParams.append("accountId", accountId);

  const url =
    queryParams.size > 0
      ? `/api/summary?${queryParams.toString()}`
      : "/api/summary";
  const query = useQuery({
    queryKey: ["summary", { from, to, accountId }],
    queryFn: async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch summary");
      }
      const { data } = await response.json();

      return {
        ...data,
        incomeAmount: convertAmountFromMilliunits(data.incomeAmount),
        expensesAmount: convertAmountFromMilliunits(data.expensesAmount),
        remainingAmount: convertAmountFromMilliunits(data.remainingAmount),
        categories: data.categories.map((category: any) => ({
          ...category,
          totalSpending: convertAmountFromMilliunits(category.totalSpending),
        })),
        days: data.days.map((day: any) => ({
          ...day,
          income: convertAmountFromMilliunits(day.income),
          expences: convertAmountFromMilliunits(day.expences),
        })),
      } as Summary;
    },
  });
  return query;
};
