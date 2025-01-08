"use client";
import React, { useState } from "react";

import { Card } from "@nextui-org/card";
import { CardProps } from "@nextui-org/card";
import { Skeleton } from "@nextui-org/skeleton";
import { formatCurrency } from "@/lib/utils";
import { ResponsiveContainer, PieChart, Pie, Cell, Sector } from "recharts";

const COLORS = [
  "#9333ea",
  "#fb00b5",
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
];

type ChartData = {
  name: string;
  totalSpending: number;
  [key: string]: string | number;
};

type CircleChartProps = {
  data: ChartData[];
  title: string;
  isLoading: boolean;
};

interface Top5ChartProps {
  data: ChartData[];
  title: string;
  isLoading: boolean;
}

export default function Top5Chart({ data, title, isLoading }: Top5ChartProps) {
  return <CircleChartCard data={data} title={title} isLoading={isLoading} />;
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  }
  return text;
};

const renderActiveShape = (props: any) => {
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
        {(percent * 100).toFixed(2)}%{" "}
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
>(({ title, data, isLoading }, ref) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: undefined, index: number) => {
    setActiveIndex(index);
  };

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
          <div className="flex h-full items-center justify-between gap-x-2">
            <ResponsiveContainer
              className="[&_.recharts-surface]:outline-none"
              height={260}
              width="80%"
            >
              <PieChart
                accessibilityLayer
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <Pie
                  data={data}
                  activeIndex={activeIndex}
                  dataKey="totalSpending"
                  innerRadius="50%"
                  nameKey="name"
                  strokeWidth={0}
                  activeShape={renderActiveShape}
                  onMouseEnter={onPieEnter}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col justify-center gap-4 p-4 text-tiny text-default-500 lg:p-0">
              {data.map(({ id, name, totalSpending }, index) => (
                <div key={id} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: COLORS[index],
                    }}
                  />
                  <span className="capitalize">
                    {name} {formatCurrency(totalSpending, "EUR")}
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
