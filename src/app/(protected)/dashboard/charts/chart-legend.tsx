import { formatCurrency } from "@/lib/utils";

interface ChartLegendProps {
  payload?: {
    value?: number | string;
    payload?: {
      amount?: number;
    };
  }[];
  colors: string[];
  currency: string;
  className?: string;
  isEmptyData: boolean;
}

export default function ChartLegend({
  payload,
  colors,
  currency,
  className = "",
  isEmptyData,
}: ChartLegendProps) {
  return (
    <div className="flex justify-end">
      <ul
        className={`flex flex-col justify-end p-3 list-none gap-x-2 gap-y-2 bg-default/40 ${className}`}
      >
        {!isEmptyData ? (
          payload?.map(({ value, payload }, i) => (
            <li
              key={`item-${i}`}
              className="capitalize flex gap-x-2 items-center"
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: colors[i] }}
              ></div>
              <div className="text-default-600 text-sm">
                {value || "Uncategorized"}:{" "}
                <span className="text-default-900">
                  {formatCurrency(Number(payload?.amount), currency)}
                </span>
              </div>
            </li>
          ))
        ) : (
          <li className="text-sm">No Data</li>
        )}
      </ul>
    </div>
  );
}
