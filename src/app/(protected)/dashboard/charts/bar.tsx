import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
  Cell,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import ChartLegend from "./chart-legend";

interface BarProps {
  data: {
    id: string;
    name: string;
    amount: number;
  }[];
  colors: string[];
  currency: string;
}

export default function BarGraph({ data, colors, currency }: BarProps) {
  const isEmptyData = !!data && data.length === 0;
  const emptyDataPayload = Array.from({ length: 5 })
    .map(() => ({
      amount: Math.floor(Math.random() * 500),
    }))
    .sort((a, b) => b.amount - a.amount);
  const renderLabel = ({
    y,
    width,
    value,
  }: {
    y?: string | number;
    width?: string | number;
    value?: string | number;
  }) => {
    return (
      <g>
        <text
          x={Number(width) + 8}
          y={Number(y) + 23}
          fontSize={12}
          fill={`hsl(var(--heroui-default-900))`}
        >
          {formatCurrency(value ? Number(value) : 0, currency)}
        </text>
      </g>
    );
  };
  return (
    <ResponsiveContainer
      className="[&_.recharts-surface]:outline-none"
      height="100%"
      width="100%"
    >
      <BarChart
        accessibilityLayer
        data={isEmptyData ? emptyDataPayload : data}
        layout="vertical"
        margin={{
          bottom: 0,
        }}
      >
        <CartesianGrid
          stroke="hsl(var(--heroui-default-200))"
          strokeDasharray="3 3"
        />
        <XAxis
          hide
          axisLine={false}
          style={{ fontSize: "var(--heroui-font-size-tiny)" }}
          tickLine={false}
          type="number"
          padding={{ right: 70 }}
        />
        <YAxis
          dataKey="name"
          hide
          strokeOpacity={0.25}
          style={{ fontSize: "var(--heroui-font-size-tiny)" }}
          type="category"
        />
        {!isEmptyData ? (
          <Tooltip
            content={({ label, payload }) => (
              <div className="flex h-auto min-w-[120px] items-center gap-x-2 rounded-medium bg-background p-2 text-tiny shadow-small">
                <div className="flex w-full flex-col gap-y-1">
                  {payload?.map((p, index) => {
                    const name = p.name;
                    const value = p.value as number;
                    const colorIndex = data.findIndex(
                      ({ amount }: { amount: number }) => amount === p.value
                    );
                    return (
                      <div
                        key={`${index}-${name}`}
                        className="flex w-full items-center gap-x-2"
                      >
                        <div
                          className="h-2 w-2 flex-none rounded-full"
                          style={{
                            backgroundColor: colors[colorIndex],
                          }}
                        />
                        <div className="flex w-full items-center justify-between gap-x-2 pr-1 text-xs text-default-700">
                          <span className="text-default-500">
                            {label || "Uncategorized"}:
                          </span>
                          <span className="text-default-700">
                            {formatCurrency(value, currency)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            cursor={false}
          />
        ) : (
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
        )}
        <Bar
          animationDuration={450}
          animationEasing="ease"
          barSize={38}
          dataKey="amount"
          layout="vertical"
          radius={[0, 8, 8, 0]}
        >
          {!!data.length
            ? data.map((_, index: number) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))
            : emptyDataPayload.map((_, index: number) => (
                <Cell key={`cell-${index}`} fill="url(#gradient1)" />
              ))}
          {!isEmptyData && (
            <LabelList
              dataKey="amount"
              fontSize={12}
              offset={4}
              position="right"
              content={renderLabel}
            />
          )}
        </Bar>
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
          layout="radial"
          verticalAlign="bottom"
          align="right"
          content={() => (
            <ChartLegend
              isEmptyData={isEmptyData}
              className="rounded-tl-[14px]"
              payload={data?.map(
                ({ name, amount }: { name: string; amount: number }) => ({
                  value: name,
                  payload: {
                    amount,
                  },
                })
              )}
              colors={colors}
              currency={currency}
            />
          )}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
