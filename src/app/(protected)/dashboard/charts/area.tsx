"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import type { Selection } from "@heroui/table";

import { Card } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { formatCurrency } from "@/lib/utils";
import AreaChartLegend from "../area-chart-legend";

type ChartData = {
  date: string;
  income: number;
  expences: number;
};

interface TransactionsChartProps {
  data: ChartData[];
  isLoading: boolean;
  currency: string;
}

export default function TransactionsAreaChart({
  data,
  isLoading,
  currency,
}: TransactionsChartProps) {
  const searchParams = useSearchParams();
  const from = searchParams?.get("from") || new Date();
  const to = searchParams?.get("to") || new Date();
  const dataRange = eachDayOfInterval({
    start: parseISO(format(from, "yyyy-MM-dd")),
    end: parseISO(format(to, "yyyy-MM-dd")),
  });
  console.log("dataRange", dataRange);
  const [chartType, setChartType] = useState<Selection>(
    new Set(["income-and-expences"])
  );
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
                      onSelectionChange={setChartType}
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
        <ResponsiveContainer
          className="[&_.recharts-surface]:outline-none"
          height={330}
          width="100%"
        >
          <AreaChart
            accessibilityLayer
            data={isEmptyData ? emptyDataPayload : data}
            margin={{
              left: 0,
              right: 0,
            }}
          >
            <defs>
              <linearGradient
                id="colorGradientIncome"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="10%"
                  stopColor={`hsl(var(--heroui-success-500))`}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={`hsl(var(--heroui-sucess-100))`}
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient
                id="colorGradientExpenses"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="10%"
                  stopColor={`hsl(var(--heroui-danger-500))`}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={`hsl(var(--heroui-danger-100))`}
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient
                id="colorGradientNoData"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="10%"
                  stopColor={`hsl(var(--heroui-default-500))`}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={`hsl(var(--heroui-default-100))`}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="hsl(var(--heroui-default-200))"
              strokeDasharray="3 3"
            />
            <XAxis
              tickSize={12}
              axisLine={false}
              dataKey="date"
              style={{
                fontSize: "var(--heroui-font-size-tiny)",
              }}
              tickLine={false}
            />

            <YAxis
              strokeOpacity={0.25}
              style={{ fontSize: "var(--heroui-font-size-tiny)" }}
            />
            {!isEmptyData && (
              <Tooltip
                content={({ label, payload }) => (
                  <div className="flex h-auto min-w-[120px] items-center gap-x-2 rounded-medium bg-background p-2 text-tiny shadow-small">
                    <div className="flex w-full flex-col gap-y-0">
                      {payload?.map((p, index) => {
                        return (
                          <div
                            key={index}
                            className="flex w-full items-center gap-x-2"
                          >
                            <div className="flex w-full items-center gap-x-1 text-xs text-foreground-500 capitalize">
                              {p.dataKey && (
                                <div className="flex w-full items-center gap-x-2">
                                  <div
                                    className="h-2 w-2 flex-none rounded-full"
                                    style={{
                                      backgroundColor:
                                        p.dataKey === "income"
                                          ? "hsl(var(--heroui-success))"
                                          : "hsl(var(--heroui-danger))",
                                    }}
                                  />
                                  <div>{p.dataKey}</div>
                                  <div className="text-default-700">
                                    {formatCurrency(
                                      p.payload[p.dataKey],
                                      currency
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <span className="text-xs font-medium text-default-500">
                        {label}
                      </span>
                    </div>
                  </div>
                )}
                cursor={{
                  strokeWidth: 0,
                }}
              />
            )}
            <Area
              activeDot={{
                stroke: `hsl(var(--heroui-success))`,
                strokeWidth: 2,
                fill: "hsl(var(--heroui-background))",
                r: 5,
              }}
              animationDuration={1000}
              animationEasing="ease"
              dataKey="income"
              fill="url(#colorGradientIncome)"
              stroke={`hsl(var(--heroui-success))`}
              strokeWidth={2}
              type="monotone"
            />
            <Area
              activeDot={{
                stroke: "hsl(var(--heroui-danger))",
                strokeWidth: 2,
                fill: "hsl(var(--heroui-background))",
                r: 5,
              }}
              animationDuration={1000}
              animationEasing="ease"
              dataKey="expences"
              fill="url(#colorGradientExpenses)"
              stroke={`hsl(var(--heroui-danger))`}
              strokeWidth={2}
              type="monotone"
            />
            {isEmptyData && (
              <>
                <Area
                  activeDot={false}
                  animationDuration={1000}
                  animationEasing="ease"
                  dataKey="noDataIncome"
                  fill="url(#colorGradientNoData)"
                  stroke={`hsl(var(--heroui-default-100))`}
                  strokeWidth={2}
                  type="monotone"
                />
                <Area
                  activeDot={false}
                  animationDuration={1000}
                  animationEasing="ease"
                  dataKey="noDataExpences"
                  fill="url(#colorGradientNoData)"
                  stroke={`hsl(var(--heroui-default-100))`}
                  strokeWidth={2}
                  type="monotone"
                />
                <text
                  className="text-cente text-sm z-10"
                  fill="hsl(var(--heroui-default-400))"
                  textAnchor="middle"
                  x="50%"
                  y="50%"
                >
                  No income and expenses in this period
                </text>
              </>
            )}
            <Legend
              layout="radial"
              verticalAlign="top"
              align="right"
              content={({ payload }) =>
                isLoading ? null : (
                  <AreaChartLegend
                    isEmptyData={isEmptyData}
                    payload={payload}
                  />
                )
              }
            />
          </AreaChart>
        </ResponsiveContainer>
        {!isLoading && (
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
        )}
      </section>
    </Card>
  );
}
