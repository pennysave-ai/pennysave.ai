import { convertAmountFromMilliunits } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

import { useSearchParams } from "next/navigation";
import {
  type CategoryResponse,
  type DailyDataResponse,
} from "@/app/api/summary/route";

export type Summary = {
  remainingAmount: number;
  remainingChange: number;
  incomeAmount: number;
  incomeChange: number;
  expensesAmount: number;
  expensesChange: number;
  categories: CategoryResponse[];
  days: DailyDataResponse[];
  expencesByCategory: { [x: string]: number | string }[];
  meta: {
    currency: {
      name: string;
      symbol: string;
      id: string;
    };
    prevPeriod: {
      start: string;
      end: string;
    };
  };
};

export const useGetSummary = () => {
  const params = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const accountId = params.get("accountId") || "";
  const currencyId =
    params.get("currencyId") ||
    (typeof window !== "undefined" && localStorage?.getItem("currencyId")) ||
    "";
  const queryParams = new URLSearchParams();

  if (from) queryParams.append("from", from);
  if (to) queryParams.append("to", to);
  if (accountId) queryParams.append("accountId", accountId);
  if (currencyId) queryParams.append("currencyId", currencyId);

  const url =
    queryParams.size > 0
      ? `/api/summary?${queryParams.toString()}`
      : "/api/summary";
  const query = useQuery({
    queryKey: ["summary", { from, to, accountId, currencyId }],
    queryFn: async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch summary");
      }
      const { data, meta } = await response.json();

      return {
        ...data,
        incomeAmount: convertAmountFromMilliunits(data.incomeAmount),
        expensesAmount: convertAmountFromMilliunits(data.expensesAmount),
        remainingAmount: convertAmountFromMilliunits(data.remainingAmount),
        categories: data.categories.map((category: CategoryResponse) => ({
          ...category,
          amount: parseFloat(
            convertAmountFromMilliunits(category.amount).toFixed(2)
          ),
        })),
        days: data.days.map((day: DailyDataResponse) => ({
          ...day,
          income: convertAmountFromMilliunits(day.income),
          expences: convertAmountFromMilliunits(day.expences),
        })),
        expencesByCategory: data.expencesByCategory.map(
          (category: { date: string; [x: string]: string | number }) => ({
            date: category.date,
            ...Object.keys(category).reduce((acc, key) => {
              if (key !== "date") {
                acc[key] = parseFloat(
                  convertAmountFromMilliunits(Number(category[key])).toFixed(2)
                );
              }
              return acc;
            }, {} as { [key: string]: number }),
          })
        ),
        meta,
      } as Summary;
    },
  });
  return query;
};
