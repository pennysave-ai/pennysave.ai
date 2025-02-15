"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { formatCurrency } from "@/lib/utils";
import { COLORS } from "@/constants";
import { convertHexToRgba } from "@/lib/utils";

import AreaChartLegend from "../area-chart-legend";

interface AreaIncomeAndExpencesProps {
  data: { [x: string]: string | number }[];
  isLoading: boolean;
  currency: string;
  isEmptyData: boolean;
  emptyDataPayload: {
    date: string;
    noDataIncome: number;
    noDataExpences: number;
  }[];
}

export default function AreaExpenceByCategory({
  data,
  isLoading,
  currency,
  emptyDataPayload,
  isEmptyData,
}: AreaIncomeAndExpencesProps) {
  return (
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
          {!!data.length &&
            Object.keys(data[0])
              .filter((key) => key !== "date")
              .map((_, i) => (
                <linearGradient
                  id={`gradient-${i}`}
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                  key={i}
                >
                  <stop offset="10%" stopColor={COLORS[i]} stopOpacity={0.3} />
                  <stop
                    offset="100%"
                    stopColor={
                      !!COLORS[i] ? convertHexToRgba(COLORS[i], 0.9) : ""
                    }
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
          <linearGradient id="colorGradientNoData" x1="0" x2="0" y1="0" y2="1">
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
        {!isEmptyData && (
          <YAxis
            strokeOpacity={0.25}
            style={{ fontSize: "var(--heroui-font-size-tiny)" }}
          />
        )}
        {!isEmptyData && (
          <Tooltip
            content={({ label, payload }) => (
              <div className="flex h-auto min-w-[120px] items-center gap-x-2 rounded-medium bg-background p-2 text-tiny shadow-small">
                <div className="flex w-full flex-col gap-y-0">
                  <span className="text-xs font-medium text-default-500">
                    {label}
                  </span>
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
                                  backgroundColor: COLORS[index],
                                }}
                              />
                              <div>
                                {typeof p.dataKey === "string"
                                  ? p.dataKey.replaceAll("_", " ")
                                  : p.dataKey}
                              </div>
                              <div className="text-default-700">
                                {formatCurrency(p.payload[p.dataKey], currency)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            cursor={{
              strokeWidth: 0,
            }}
          />
        )}
        {!!data.length &&
          Object.keys(data[0])
            .filter((key) => key !== "date")
            .map((key, i) => {
              return (
                <Area
                  key={i}
                  activeDot={{
                    stroke: COLORS[i],
                    strokeWidth: 2,
                    fill: COLORS[i],
                    r: 5,
                  }}
                  animationDuration={1000}
                  animationEasing="ease"
                  dataKey={key}
                  fill={`url(#gradient-${i})`}
                  stroke={`${COLORS[i]}`}
                  strokeWidth={2}
                  type="monotone"
                />
              );
            })}
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
              <AreaChartLegend isEmptyData={isEmptyData} payload={payload} />
            )
          }
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
