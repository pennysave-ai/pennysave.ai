"use client";

import React from "react";
import CountUp from "react-countup";
import { parseISO, format } from "date-fns";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { Tooltip } from "@heroui/tooltip";

import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Skeleton } from "@heroui/skeleton";
import { cn } from "@heroui/theme";
import { Icon } from "@iconify/react";

interface DataCardProps {
  title: string;
  type: string;
  value: number | undefined;
  change: number | undefined;
  prefix: string | undefined;
  data: {
    day: string;
    value: number;
  }[];
  isLoading?: boolean;
  prevPeriod:
    | {
        start: string;
        end: string;
      }
    | undefined;
  displayOnly?: boolean;
}

export default function DataCard({
  data,
  title,
  value,
  change = 0,
  type,
  prefix,
  isLoading,
  prevPeriod,
  displayOnly = false,
}: DataCardProps) {
  const getChangeType = () => {
    if (change === 0) return "neutral";
    switch (type) {
      case "income":
      case "remaining":
        return change < 0 ? "negative" : "positive";
      case "expenses":
        return change < 0 ? "positive" : "negative";
    }
  };
  const drawArrow = () => {
    if (change === 0)
      return <Icon height={16} icon="solar:arrow-right-linear" width={16} />;
    if (change < 0)
      return (
        <Icon height={16} icon="solar:arrow-right-down-linear" width={16} />
      );
    if (change > 0)
      return <Icon height={16} icon="solar:arrow-right-up-linear" width={16} />;
  };
  const prevPeriodStartDate = prevPeriod?.start
    ? format(parseISO(prevPeriod?.start), "PP")
    : "";
  const prevPeriodEndDate = prevPeriod?.end
    ? format(parseISO(prevPeriod?.end), "PP")
    : "";

  if (isLoading) {
    return (
      <Card className="border border-transparent dark:border-default-100">
        <section className="flex flex-nowrap justify-between">
          <div className="flex flex-col justify-between gap-y-2 p-4">
            <div className="flex flex-col gap-y-4">
              <dl className="grid w-full">
                <dt className="text-sm font-medium text-default-600">
                  <Skeleton className="w-20 h-5 rounded" />
                </dt>
                <dd className="text-3xl font-semibold text-default-700">
                  <Skeleton className="w-36 h-9 rounded" />
                </dd>
              </dl>
            </div>
            <div className="mt-2 flex items-center gap-x-1 text-xs font-medium">
              <Skeleton className="w-44 h-4 rounded" />
            </div>
          </div>
        </section>
      </Card>
    );
  }
  return (
    <Card className="border border-transparent dark:border-default-100">
      <section className="flex flex-nowrap justify-between">
        <div className="flex flex-col justify-between gap-y-2 p-4 truncate">
          <div className="flex flex-col gap-y-4">
            <dl className="grid w-full">
              <dt className="text-sm font-medium text-default-500">{title}</dt>
              <dd className="text-3xl font-semibold text-default-700">
                <CountUp
                  decimals={2}
                  duration={1.6}
                  end={value || 0}
                  start={0}
                  prefix={prefix}
                />
              </dd>
            </dl>
          </div>
          <div
            className={cn(
              "mt-2 flex items-center gap-x-1 text-xs font-medium",
              {
                "text-success-700 dark:text-success-500":
                  getChangeType() === "positive",
                "text-warning-500": getChangeType() === "neutral",
                "text-danger-600": getChangeType() === "negative",
              }
            )}
          >
            {drawArrow()}
            <div>{change?.toFixed(2) || 0}%</div>
            <div className="text-default-500 dark:text-default-500 truncate">
              vs prev period
            </div>
            <Tooltip
              isDisabled={displayOnly}
              content={`${prevPeriodStartDate} - ${prevPeriodEndDate}`}
            >
              <Icon
                height={16}
                icon="solar:info-circle-linear"
                className={cn(
                  "text-default-400 dark:text-default-500 cursor-pointer",
                  {
                    "cursor-auto": displayOnly,
                  }
                )}
                width={16}
              />
            </Tooltip>
          </div>
        </div>
        <div className="mt-10 min-h-24 w-36 min-w-[140px] shrink-0">
          <ResponsiveContainer
            className="[&_.recharts-surface]:outline-none"
            width="100%"
          >
            <AreaChart accessibilityLayer data={data}>
              <defs>
                <linearGradient
                  id={"colorUv" + type}
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={cn({
                      "hsl(var(--heroui-success))":
                        getChangeType() === "positive",
                      "hsl(var(--heroui-danger))":
                        getChangeType() === "negative",
                      "hsl(var(--heroui-warning))":
                        getChangeType() === "neutral",
                    })}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="60%"
                    stopColor={cn({
                      "hsl(var(--heroui-success))":
                        getChangeType() === "positive",
                      "hsl(var(--heroui-danger))":
                        getChangeType() === "negative",
                      "hsl(var(--heroui-warning))":
                        getChangeType() === "neutral",
                    })}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <YAxis
                domain={[Math.min(...data.map((d) => d.value)), "auto"]}
                hide={true}
              />
              <Area
                dataKey="value"
                fill={`url(#colorUv${type})`}
                stroke={cn({
                  "hsl(var(--heroui-success))": getChangeType() === "positive",
                  "hsl(var(--heroui-danger))": getChangeType() === "negative",
                  "hsl(var(--heroui-warning))": getChangeType() === "neutral",
                })}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <Dropdown
          isDisabled={displayOnly}
          classNames={{
            content: "min-w-[120px]",
          }}
          placement="bottom-end"
        >
          <DropdownTrigger>
            <Button
              aria-label="open dropdown menu"
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
