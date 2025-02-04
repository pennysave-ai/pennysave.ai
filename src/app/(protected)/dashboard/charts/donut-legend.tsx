import { formatCurrency } from "@/lib/utils";

interface DonutLegend {
  payload?: {
    value?: number;
    payload?: {
      amount?: number;
    };
  }[];
  colors: string[];
  currency: string;
  className?: string;
}

export default function DonutLegend({
  payload,
  colors,
  currency,
  className = "",
}: DonutLegend) {
  console.log("payload", payload);
  return (
    <div className="flex justify-end">
      <ul
        className={`flex flex-col justify-end p-3 list-none gap-x-2 gap-y-2 bg-default/40 ${className}`}
      >
        {payload?.map(({ value, payload }, i) => (
          <li
            key={`item-${i}`}
            className="capitalize flex gap-x-2 items-center"
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: colors[i] }}
            ></div>
            <div className="text-default-600 text-sm">
              {value}:{" "}
              <span className="text-default-900">
                {formatCurrency(Number(payload?.amount), currency)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
