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
import DonutLegend from "./donut-legend";

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
          y={Number(y) + 17}
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
        data={data}
        layout="vertical"
        margin={{
          top: 12,
          right: 0,
          left: 0,
          bottom: 64,
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
        />
        <YAxis
          dataKey="name"
          hide
          strokeOpacity={0.25}
          style={{ fontSize: "var(--heroui-font-size-tiny)" }}
          type="category"
        />
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
                        <span className="text-default-500">{label}:</span>
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
        <Bar
          animationDuration={450}
          animationEasing="ease"
          barSize={26}
          dataKey="amount"
          layout="vertical"
          radius={[0, 8, 8, 0]}
        >
          {data.map((_, index: number) => (
            <Cell key={`cell-${index}`} fill={colors[index]} />
          ))}
          <LabelList
            dataKey="amount"
            fontSize={12}
            offset={4}
            position="right"
            content={renderLabel}
          />
        </Bar>
        <Legend
          layout="radial"
          verticalAlign="bottom"
          align="right"
          content={() => (
            <DonutLegend
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
