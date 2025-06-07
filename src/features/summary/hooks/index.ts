import { convertAmountFromMilliunits } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

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

export const useGetSummary = ({
  start = null,
  end = null,
  accountId = null,
  currencyId = null,
}: {
  start?: string | null;
  end?: string | null;
  accountId?: string | null;
  currencyId?: string | null;
}) => {
  const queryParams = new URLSearchParams();

  if (start) queryParams.append("start", start);
  if (end) queryParams.append("end", end);
  if (accountId) queryParams.append("accountId", accountId);
  if (currencyId) queryParams.append("currencyId", currencyId);

  const url =
    queryParams.size > 0
      ? `/api/summary?${queryParams.toString()}`
      : "/api/summary";
  const query = useQuery({
    queryKey: ["summary", { start, end, accountId, currencyId }],
    queryFn: async () => {
      if (!start || !end || !accountId || !currencyId) {
        return null;
      }
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
