"use client";

import { parseISO, format } from "date-fns";
import { useGetSummary } from "@/features/summary/hooks";
import { Hero } from "@/components/common";
import DateRangePicker from "./date-range-picker";

import AccountsFilter from "./account-filter";
import Top5Chart from "./top-5-chart";
import DataCard from "./data-card";
import TransactionsChart from "./transactions-chart";
import BaseCurrencyFilter from "./base-currency-filter";

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
      <Hero description="Analyze, your expenses and income" />
      <div className="-mt-[72px] lg:-mt-[216px] grid grid-cols-1 gap-5 md:grid-cols-1 lg:grid-cols-3 max-w-screen-2xl mx-auto px-4 w-full mb-4 place-content-end">
        <div className="grid w-full col-start-1 lg:col-start-3 gap-y-4">
          <div className="grid w-full">
            <DateRangePicker />
          </div>
          <div className="flex gap-x-3">
            <AccountsFilter />
            <BaseCurrencyFilter currencyId={data?.meta.currency.id || ""} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-1 lg:grid-cols-3 max-w-screen-2xl mx-auto px-4 w-full mb-4">
        <DataCard
          isLoading={isLoading}
          title="Income"
          type="income"
          value={data?.incomeAmount}
          prefix={data?.meta.currency.symbol}
          change={data?.incomeChange}
          data={incomeData || []}
          prevPeriod={data?.meta.prevPeriod}
        />
        <DataCard
          isLoading={isLoading}
          title="Expences"
          type="expenses"
          value={Math.abs(data?.expensesAmount || 0)}
          prefix={data?.meta.currency.symbol || ""}
          change={data?.expensesChange}
          data={expensesData || []}
          prevPeriod={data?.meta.prevPeriod}
        />
        <DataCard
          title="Remaining"
          type="remaining"
          isLoading={isLoading}
          value={data?.remainingAmount}
          prefix={data?.meta.currency.symbol}
          change={data?.remainingChange}
          data={remainingData || []}
          prevPeriod={data?.meta.prevPeriod}
        />
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-1 lg:grid-cols-3 max-w-screen-2xl mx-auto px-4 w-full">
        <TransactionsChart
          data={transactionsData || []}
          isLoading={isLoading}
          currency={data?.meta.currency.name || ""}
        />
        <Top5Chart
          isLoading={isLoading}
          title="Top 5 Spending Categories"
          data={data?.categories || []}
          currency={data?.meta.currency.name || ""}
        />
      </div>
    </div>
  );
}
