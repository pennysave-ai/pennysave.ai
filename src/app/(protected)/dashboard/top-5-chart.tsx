"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Card } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";
import React from "react";
import { Select, SelectItem } from "@heroui/select";
import Donut from "./charts/donut";
import BarGraph from "./charts/bar";
import { COLORS } from "@/constants";

type ChartData = {
  id: string;
  name: string;
  amount: number;
};

interface Top5Chart {
  data: ChartData[];
  currency: string;
  isLoading: boolean;
}

export default function Top5Chart({ data, isLoading, currency }: Top5Chart) {
  const [chartType, setChartType] = useState(new Set(["bar"]));
  return (
    <Card className="h-[400px] border border-transparent dark:border-default-100">
      <div className="flex flex-col gap-y-2 p-4">
        <div className="flex items-center justify-between gap-x-2">
          <dt className="w-full">
            {isLoading ? (
              <Skeleton className="h-6 w-64 rounded" />
            ) : (
              <div className="flex justify-between items-center">
                <h3 className="text-small font-medium text-default-500">
                  Top 5 Spending Categories
                </h3>
                <div className="flex items-center">
                  <Select
                    size="sm"
                    selectedKeys={chartType}
                    onSelectionChange={(keys) =>
                      setChartType(new Set(Array.from(keys) as string[]))
                    }
                    classNames={{
                      base: "max-w-xs p-0 w-40",
                    }}
                  >
                    <SelectItem
                      key="bar"
                      startContent={
                        <Icon icon="solar:chart-bold" rotate={45} />
                      }
                    >
                      Bar Chart
                    </SelectItem>
                    <SelectItem
                      key="donut"
                      startContent={<Icon icon="solar:pie-chart-3-bold" />}
                    >
                      Donut Chart
                    </SelectItem>
                  </Select>
                </div>
              </div>
            )}
          </dt>
        </div>
      </div>
      {!isLoading && (
        <>
          {chartType?.has("donut") && (
            <Donut data={data} isLoading={isLoading} currency={currency} />
          )}
          {chartType?.has("bar") && (
            <BarGraph data={data} colors={COLORS} currency={currency} />
          )}
        </>
      )}
    </Card>
  );
}
