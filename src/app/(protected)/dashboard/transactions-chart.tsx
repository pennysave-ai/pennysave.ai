"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { format, subDays } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Button } from "@nextui-org/button";
import { Card } from "@nextui-org/card";
import { Skeleton } from "@nextui-org/skeleton";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/dropdown";
import { formatCurrency } from "@/lib/utils";

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

export default function TransactionsChart({
  data,
  isLoading,
  currency,
}: TransactionsChartProps) {
  const isEmptyData = !!data && !isLoading && data.length === 0;
  const emptyDataPayload = [
    {
      date: format(subDays(new Date(), 8), "PP"),
      noData: 10,
    },
    {
      date: format(subDays(new Date(), 7), "PP"),
      noData: 200,
    },
    {
      date: format(subDays(new Date(), 6), "PP"),
      noData: 90,
    },
    {
      date: format(subDays(new Date(), 5), "PP"),
      noData: 10,
    },
    {
      date: format(subDays(new Date(), 4), "PP"),
      noData: 150,
    },
    {
      date: format(subDays(new Date(), 3), "PP"),
      noData: 30,
    },
    {
      date: format(subDays(new Date(), 2), "PP"),
      noData: 110,
    },
    {
      date: format(subDays(new Date(), 1), "PP"),
      noData: 40,
    },
  ];
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
                  "Income and Expenses"
                )}
              </dt>
            </div>
          </div>
        </div>
        <ResponsiveContainer
          className="[&_.recharts-surface]:outline-none"
          height={300}
        >
          <AreaChart
            accessibilityLayer
            data={isEmptyData ? emptyDataPayload : data}
            height={300}
            margin={{
              left: 0,
              right: 0,
            }}
            width={500}
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
                  stopColor={`hsl(var(--nextui-success-500))`}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={`hsl(var(--nextui-sucess-100))`}
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
                  stopColor={`hsl(var(--nextui-danger-500))`}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={`hsl(var(--nextui-danger-100))`}
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
                  stopColor={`hsl(var(--nextui-default-500))`}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={`hsl(var(--nextui-default-100))`}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              horizontalCoordinatesGenerator={() => [200, 150, 100, 50]}
              stroke="hsl(var(--nextui-default-200))"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="date"
              style={{
                fontSize: "var(--nextui-font-size-tiny)",
                transform: "translateX(-40px)",
              }}
              tickLine={false}
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
                            <div className="flex w-full items-center gap-x-1 text-small text-foreground-500 capitalize">
                              {p.dataKey && (
                                <>
                                  <span
                                    className={
                                      p.dataKey === "income"
                                        ? "text-success"
                                        : "text-danger"
                                    }
                                  >
                                    {p.dataKey}
                                  </span>
                                  <span>
                                    {formatCurrency(
                                      p.payload[p.dataKey],
                                      currency
                                    )}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <span className="text-small font-medium text-foreground-400">
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
                stroke: `hsl(var(--nextui-success))`,
                strokeWidth: 2,
                fill: "hsl(var(--nextui-background))",
                r: 5,
              }}
              animationDuration={1000}
              animationEasing="ease"
              dataKey="income"
              fill="url(#colorGradientIncome)"
              stroke={`hsl(var(--nextui-success))`}
              strokeWidth={2}
              type="monotone"
            />
            <Area
              activeDot={{
                stroke: "hsl(var(--nextui-danger))",
                strokeWidth: 2,
                fill: "hsl(var(--nextui-background))",
                r: 5,
              }}
              animationDuration={1000}
              animationEasing="ease"
              dataKey="expences"
              fill="url(#colorGradientExpenses)"
              stroke={`hsl(var(--nextui-danger))`}
              strokeWidth={2}
              type="monotone"
            />
            {isEmptyData && (
              <>
                <Area
                  activeDot={false}
                  animationDuration={1000}
                  animationEasing="ease"
                  dataKey="noData"
                  fill="url(#colorGradientNoData)"
                  stroke={`hsl(var(--nextui-default-100))`}
                  strokeWidth={2}
                  type="monotone"
                />
                <text
                  className="text-cente text-sm z-10"
                  fill="hsl(var(--nextui-default-400))"
                  textAnchor="middle"
                  x="50%"
                  y="50%"
                >
                  No income and expenses in this period
                </text>
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
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
            <DropdownItem key="view-details">View Details</DropdownItem>
            <DropdownItem key="export-data">Export Data</DropdownItem>
            <DropdownItem key="set-alert">Set Alert</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </section>
    </Card>
  );
}
