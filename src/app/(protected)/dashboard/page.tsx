"use client";

import { parseISO, format } from "date-fns";
import { useGetSummary } from "@/features/summary/hooks";
import { Hero } from "@/components/common";
import Top5Chart from "./top-5-chart";
import DataCard from "./data-card";
import TransactionsChart from "./transactions-chart";

export default function DashboardPage() {
  const { data, isLoading } = useGetSummary();
  const incomeData = data?.days.map((day) => ({
    day: day.date,
    value: day.income,
  }));
  const expensesData = data?.days.map((day) => ({
    day: day.date,
    value: Math.abs(day.expences),
  }));
  const remainingData = data?.days.map((day) => ({
    day: day.date,
    value: Math.abs(day.expences - day.income),
  }));
  const transactionsData = data?.days.map((day) => ({
    date: format(parseISO(day.date), "PP"),
    income: day.income,
    expences: Math.abs(day.expences),
  }));
  return (
    <div className="relative z-10 flex flex-col w-full">
      <Hero />
      <div className="-mt-24 grid grid-cols-1 gap-5 md:grid-cols-1 lg:grid-cols-3 max-w-screen-2xl mx-auto px-4 w-full mb-4">
        <DataCard
          isLoading={isLoading}
          title="Income"
          type="income"
          value={data?.incomeAmount}
          change={data?.incomeChange}
          changeType={
            data?.incomeChange && data?.incomeChange > 0
              ? "positive"
              : "negative"
          }
          data={incomeData || []}
        />
        <DataCard
          title="Expences"
          type="expenses"
          isLoading={isLoading}
          value={data?.expensesAmount}
          change={data?.expensesChange}
          changeType={
            data?.expensesChange && data?.expensesChange < 0
              ? "positive"
              : "negative"
          }
          data={expensesData || []}
        />
        <DataCard
          title="Remaining"
          type="income"
          isLoading={isLoading}
          value={data?.remainingAmount}
          change={data?.remainingChange}
          changeType={
            data?.remainingChange && data?.remainingChange > 0
              ? "positive"
              : "negative"
          }
          data={remainingData || []}
        />
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-1 lg:grid-cols-3 max-w-screen-2xl mx-auto px-4 w-full">
        <TransactionsChart
          data={transactionsData || []}
          isLoading={isLoading}
        />
        <Top5Chart
          isLoading={isLoading}
          title="Top 5 Spending Categories"
          data={data?.categories || []}
        />
      </div>
    </div>
  );
}
