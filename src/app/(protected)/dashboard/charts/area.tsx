"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";

import { Card } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import AreaIncomeAndExpences from "./area-income-and-expences";
import AreaExpenceByCategory from "./area-expence-by-category";

type ChartData = {
  date: string;
  income: number;
  expences: number;
};

interface TransactionsChartProps {
  data: ChartData[];
  isLoading: boolean;
  currency: string;
  transactionsByExpenses: { [x: string]: string | number }[];
}

export default function TransactionsAreaChart({
  data,
  isLoading,
  currency,
  transactionsByExpenses,
}: TransactionsChartProps) {
  const searchParams = useSearchParams();
  const from = searchParams?.get("from") || new Date();
  const to = searchParams?.get("to") || new Date();
  const dataRange = eachDayOfInterval({
    start: parseISO(format(from, "yyyy-MM-dd")),
    end: parseISO(format(to, "yyyy-MM-dd")),
  });
  const [chartType, setChartType] = useState(new Set(["by-expence-category"]));
  const isEmptyData = !!data && !isLoading && data.length === 0;
  const emptyDataPayload = dataRange.map((date) => ({
    date: format(date, "PP"),
    noDataIncome: Math.floor(Math.random() * 200),
    noDataExpences: Math.floor(Math.random() * 200),
  }));
  return (
    <Card
      as="dl"
      className="border border-transparent dark:border-default-100 lg:col-span-2 md:col-span-1"
    >
      <section className="flex flex-col flex-nowrap">
        <div className="flex flex-col justify-between gap-y-2 p-4">
          <div className="flex flex-col gap-y-2">
            <div className="flex flex-col gap-y-0">
              <dt className="text-sm font-medium text-default-600">
                {isLoading ? (
                  <Skeleton className="h-6 w-64 rounded" />
                ) : (
                  <div className="flex items-center">
                    <Select
                      size="sm"
                      selectedKeys={chartType}
                      disallowEmptySelection
                      onSelectionChange={(keys) =>
                        setChartType(new Set(Array.from(keys) as string[]))
                      }
                      classNames={{
                        base: "max-w-xs p-0 w-52",
                      }}
                    >
                      <SelectItem key="income-and-expences">
                        Income and Expenses
                      </SelectItem>
                      <SelectItem key="by-expence-category">
                        Expences by Category
                      </SelectItem>
                    </Select>
                  </div>
                )}
              </dt>
            </div>
          </div>
        </div>
        {!isLoading && (
          <>
            {chartType?.has("income-and-expences") && (
              <AreaIncomeAndExpences
                data={data}
                isLoading={isLoading}
                currency={currency}
                emptyDataPayload={emptyDataPayload}
                isEmptyData={isEmptyData}
              />
            )}
            {chartType?.has("by-expence-category") && (
              <AreaExpenceByCategory
                data={transactionsByExpenses}
                isLoading={isLoading}
                currency={currency}
                emptyDataPayload={emptyDataPayload}
                isEmptyData={isEmptyData}
              />
            )}
            <Dropdown
              classNames={{
                content: "min-w-[120px]",
              }}
              placement="bottom-end"
            >
              <DropdownTrigger>
                <Button
                  isIconOnly
                  className="absolute right-2 top-2 w-auto rounded-full"
                  size="sm"
                  variant="light"
                >
                  <Icon height={16} icon="solar:menu-dots-bold" width={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                itemClasses={{
                  title: "text-tiny",
                }}
                variant="flat"
              >
                <DropdownItem key="export-data">Export Data</DropdownItem>
                <DropdownItem key="set-alert">Set Alert</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </>
        )}
      </section>
    </Card>
  );
}
