"use client";

import { parseISO, format } from "date-fns";
import { useGetSummary } from "@/features/summary/hooks";
import { Hero } from "@/components/common";
import DateRangePicker from "./date-range-picker";

import AccountsFilter from "./account-filter";
import Top5Chart from "./top-5-chart";
import DataCard from "./data-card";
import TransactionsAreaChart from "./charts/area";
import BaseCurrencyFilter from "./base-currency-filter";
// import FloatingButton from "./float-button";
// import Notifications from "./notifications";
// import FinancialGoals from "./financial-goals";

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
  const transactionsByExpenses = data?.expencesByCategory.map((category) => ({
    ...category,
    date: format(parseISO(category.date as string), "PP"),
  }));
  return (
    <div className="relative z-10 flex flex-col w-full gap-y-4">
      <Hero description="Analyze, your expenses and income" />
      <div className="-mt-[72px] lg:-mt-[216px] grid grid-cols-1 gap-5 md:grid-cols-1 lg:grid-cols-3 max-w-screen-2xl mx-auto px-4 w-full place-content-end">
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
      <div className="grid grid-cols-1 gap-5 md:grid-cols-1 lg:grid-cols-3 max-w-screen-2xl mx-auto px-4 w-full">
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
          title="Expenses"
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
      <div className="grid grid-cols-1 gap-5 md:grid-cols-1 lg:grid-cols-3 max-w-screen-2xl mx-auto px-4 w-full relative">
        <TransactionsAreaChart
          data={transactionsData || []}
          isLoading={isLoading}
          currency={data?.meta.currency.name || ""}
          transactionsByExpenses={transactionsByExpenses || []}
        />
        <Top5Chart
          isLoading={isLoading}
          data={data?.categories || []}
          currency={data?.meta.currency.name || ""}
        />
        {/* <FloatingButton /> */}
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-1 lg:grid-cols-3 max-w-screen-2xl mx-auto px-4 w-full relative">
        {/* <Notifications /> */}
        {/* <FinancialGoals /> */}
      </div>
    </div>
  );
}
