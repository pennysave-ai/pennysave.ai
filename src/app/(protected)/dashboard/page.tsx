"use client";

import Script from "next/script";
import { useState, useEffect } from "react";
import { parseISO, format } from "date-fns";
import {
  today,
  getLocalTimeZone,
  startOfMonth,
  CalendarDate,
} from "@internationalized/date";
import { useGetSummary } from "@/features/summary/hooks";
import { useGetCurrencies } from "@/features/currencies/hooks";
import { useGetAccounts } from "@/features/accounts/hooks";
import { Hero } from "@/components/common";
import { BASE_CURRENCY } from "@/constants";
import DateRangePicker from "./date-range-picker";

import AccountsFilter from "./account-filter";
import Top5Chart from "./top-5-chart";
import DataCard from "./data-card";
import TransactionsAreaChart from "./charts/area";
import BaseCurrencyFilter from "./base-currency-filter";
import { convertCalendarDateToDateString } from "@/lib/utils";
import Budgets from "./budgets";

export default function DashboardPage() {
  const { data: currencyData, isLoading: isCurrenctLoading } =
    useGetCurrencies();
  const { data: accountData, isLoading: isAccountLoading } = useGetAccounts();
  const now = today(getLocalTimeZone());
  useEffect(() => {
    if (accountData && currencyData) {
      if (!localStorage.getItem("currencyId")) {
        const [currency] = currencyData.data.filter(
          (currency) => currency.name === BASE_CURRENCY.toUpperCase()
        );
        localStorage.setItem("currencyId", currency.id);
      }
      if (!localStorage.getItem("accountId")) {
        localStorage.setItem("accountId", "all");
      }
      setSummaryData((prev) => ({
        ...prev,
        accountId: localStorage.getItem("accountId"),
        currencyId: localStorage.getItem("currencyId"),
      }));
    }
  }, [accountData, currencyData]); // eslint-disable-line react-hooks/exhaustive-deps
  const [summaryData, setSummaryData] = useState<{
    start: CalendarDate;
    end: CalendarDate;
    accountId: string | null;
    currencyId: string | null;
  }>({
    start: startOfMonth(now),
    end: now,
    accountId: null,
    currencyId:
      (typeof window !== "undefined" && localStorage?.getItem("currencyId")) ||
      null,
  });
  const { data, isLoading } = useGetSummary({
    ...summaryData,
    start: convertCalendarDateToDateString(summaryData.start),
    end: convertCalendarDateToDateString(summaryData.end),
  });

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

  const onDateRangeChange = ({
    start,
    end,
  }: {
    start: CalendarDate;
    end: CalendarDate;
  }) => {
    setSummaryData((prev) => ({
      ...prev,
      start,
      end,
    }));
  };

  const onCurrencyChange = (currencyId: string) => {
    setSummaryData((prev) => ({
      ...prev,
      currencyId,
    }));
    localStorage.setItem("currencyId", currencyId);
  };
  const onAccountChange = (accountId: string) => {
    // console.log("@accountData", accountData);
    // console.log("@accountId", accountId);
    let currencyId = null;
    if (accountId === "all") {
      currencyId = localStorage.getItem("currencyId");
    } else {
      currencyId = accountData?.data.find(
        (account) => account.id === accountId
      )?.currencyId;
    }
    setSummaryData((prev) => ({
      ...prev,
      accountId,
      currencyId: currencyId ?? null,
    }));
    localStorage.setItem("accountId", accountId);
  };
  const { start, end, accountId, currencyId } = summaryData;
  return (
    <div className="relative z-10 flex flex-col w-full gap-y-4">
      <Hero description="Analyze, your expenses and income" />
      <Script
        id="google-ads-conversion"
        strategy="afterInteractive"
        async={false}
      >
        {`gtag('event', 'conversion', {'send_to': 'AW-17082312814/GbSICJnwocgaEO7QvdE_'});`}
      </Script>
      <div className="-mt-[72px] lg:-mt-[216px] grid grid-cols-1 gap-5 md:grid-cols-1 lg:grid-cols-3 max-w-screen-2xl mx-auto px-4 w-full place-content-end">
        <div className="grid w-full col-start-1 lg:col-start-3 gap-y-4">
          <div className="grid w-full">
            <DateRangePicker
              start={start}
              end={end}
              onDateRangeChange={onDateRangeChange}
            />
          </div>
          <div className="flex gap-x-3">
            <AccountsFilter
              onChange={onAccountChange}
              isLoading={isAccountLoading}
              data={accountData?.data}
              accountId={accountId || ""}
            />
            <BaseCurrencyFilter
              accountId={accountId || ""}
              currencyId={currencyId || ""}
              onChange={onCurrencyChange}
              isLoading={isCurrenctLoading}
              data={currencyData?.data}
            />
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
        <Budgets
          startDate={start}
          endDate={end}
          currencies={currencyData?.data}
        />
      </div>
    </div>
  );
}
