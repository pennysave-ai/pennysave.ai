"use client";

import React, { useState } from "react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  Legend,
} from "recharts";
import { type CategoryResponse } from "@/app/api/summary/route";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import ChartLegend from "./chart-legend";

const COLORS = [
  "#9333ea",
  "#fb00b5",
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
];

type DonutProps = {
  data: CategoryResponse[];
  isLoading: boolean;
  currency: string;
};

export default function Donut({ data, isLoading, currency }: DonutProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const onPieEnter = (_: undefined, index: number) => {
    setActiveIndex(index);
  };
  const isEmptyData = !!data && !isLoading && data.length === 0;
  const emptyDataPayload = Array.from({ length: 5 })
    .map(() => ({
      amount: Math.floor(Math.random() * 200),
    }))
    .sort((a, b) => b.amount - a.amount);
  return (
    <>
      <ResponsiveContainer
        className="[&_.recharts-surface]:outline-none"
        height="100%"
        width="100%"
      >
        <PieChart
          accessibilityLayer
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <Pie
            data={isEmptyData ? emptyDataPayload : data}
            activeIndex={activeIndex}
            dataKey="amount"
            innerRadius="50%"
            nameKey="name"
            strokeWidth={0}
            activeShape={!isEmptyData && renderActiveShape}
            onMouseEnter={!isEmptyData ? onPieEnter : () => {}}
          >
            {isEmptyData
              ? emptyDataPayload.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="url(#gradient1)" />
                ))
              : data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
          </Pie>
          {isEmptyData && (
            <text
              className="text-cente text-sm z-10"
              fill="hsl(var(--heroui-default-400))"
              textAnchor="middle"
              x="50%"
              y="50%"
            >
              No expenses in this period
            </text>
          )}
          <Legend
            layout="centric"
            verticalAlign="top"
            align="left"
            content={({ payload }) =>
              isLoading ? null : (
                <ChartLegend
                  className="rounded-br-[14px]"
                  isEmptyData={isEmptyData}
                  payload={payload?.map(({ value, payload }) => ({
                    value,
                    payload: {
                      amount: payload?.value,
                    },
                  }))}
                  colors={COLORS}
                  currency={currency}
                />
              )
            }
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                style={{
                  stopColor: "hsl(var(--heroui-default-100))",
                  stopOpacity: 1,
                }}
              />
              <stop
                offset="100%"
                style={{
                  stopColor: "hsl(var(--heroui-default-200))",
                  stopOpacity: 1,
                }}
              />
            </linearGradient>
          </defs>
        </PieChart>
      </ResponsiveContainer>
    </>
  );
}

const truncateText = (text: string, maxLength: number) => {
  if (text?.length > maxLength) {
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
        {truncateText(payload.name, 14) || "Uncategorized"}
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
