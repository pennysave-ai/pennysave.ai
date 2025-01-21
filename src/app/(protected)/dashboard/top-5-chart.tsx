"use client";

import React, { useState } from "react";

import { Card } from "@heroui/card";
import { CardProps } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { ResponsiveContainer, PieChart, Pie, Cell, Sector } from "recharts";
import { type CategoryResponse } from "@/app/api/summary/route";
import { PieSectorDataItem } from "recharts/types/polar/Pie";

const COLORS = [
  "#9333ea",
  "#fb00b5",
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
];

type CircleChartProps = {
  data: CategoryResponse[];
  title: string;
  isLoading: boolean;
  currency: string;
};

interface Top5ChartProps {
  data: CategoryResponse[];
  title: string;
  isLoading: boolean;
  currency: string;
}

export default function Top5Chart({
  data,
  title,
  isLoading,
  currency,
}: Top5ChartProps) {
  return (
    <CircleChartCard
      data={data}
      title={title}
      isLoading={isLoading}
      currency={currency}
    />
  );
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  }
  return text;
};

const renderActiveShape = (props: PieSectorDataItem) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
  } = props;
  if (payload.payload.id === "empty") {
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <text
          x={cx}
          y={cy}
          dy={0}
          textAnchor="middle"
          fill="hsl(var(--heroui-default-400))"
          className="text-sm"
        >
          {payload.name}
        </text>
      </g>
    );
  }
  return (
    <g>
      <text
        x={cx}
        y={cy}
        dy={0}
        textAnchor="middle"
        fill={fill}
        className="text-sm font-semibold overflow-hidden"
      >
        {truncateText(payload.name, 14)}
      </text>
      <text
        x={cx}
        y={cy}
        dy={16}
        textAnchor="middle"
        fill={fill}
        className="text-sm font-semibold"
      >
        {" "}
        {percent && (percent * 100).toFixed(2)}%{" "}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

const CircleChartCard = React.forwardRef<
  HTMLDivElement,
  Omit<CardProps, "children"> & CircleChartProps
>(({ title, data, isLoading, currency }, ref) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const onPieEnter = (_: undefined, index: number) => {
    setActiveIndex(index);
  };
  const isEmptyData = !!data && !isLoading && data.length === 0;
  return (
    <Card className="md:col-span-1 border border-transparent dark:border-default-100">
      <dl>
        <div className="bg-default-300s p-4">
          <div ref={ref} className="flex flex-col">
            <div className="flex items-center justify-between gap-x-2">
              <div className="text-sm font-medium text-default-600">
                {isLoading ? <Skeleton className="h-5 w-64 rounded" /> : title}
              </div>
            </div>
          </div>
          <div className="h-full items-center justify-between gap-x-2">
            <ResponsiveContainer
              className="[&_.recharts-surface]:outline-none"
              height={300}
            >
              <PieChart
                accessibilityLayer
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <Pie
                  data={
                    isEmptyData
                      ? [
                          {
                            id: "empty",
                            name: "No expences in this period",
                            amount: 100,
                          },
                        ]
                      : data
                  }
                  activeIndex={activeIndex}
                  dataKey="amount"
                  innerRadius="50%"
                  nameKey="name"
                  strokeWidth={0}
                  activeShape={renderActiveShape}
                  onMouseEnter={onPieEnter}
                >
                  {isEmptyData ? (
                    <Cell fill="hsl(var(--heroui-default-100))" />
                  ) : (
                    data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 p-4 text-tiny text-default-500 lg:p-0">
              {data.map(({ id, name, amount }, index) => (
                <div key={id} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: COLORS[index],
                    }}
                  />
                  <span className="capitalize">
                    {name} {formatCurrency(amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </dl>
    </Card>
  );
});

CircleChartCard.displayName = "CircleChartCard";
