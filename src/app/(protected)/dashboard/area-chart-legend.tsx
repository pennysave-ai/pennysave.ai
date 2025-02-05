import { cn } from "@heroui/theme";

interface AreaChartLegendProps {
  payload?: {
    value: string;
  }[];
  isEmptyData: boolean;
}
export default function AreaChartLegend({
  payload,
  isEmptyData,
}: AreaChartLegendProps) {
  return (
    <div className="flex justify-end">
      <ul className="flex justify-end p-3 text-sm list-none gap-x-2 bg-default/40 rounded-bl-[14px]">
        {!isEmptyData ? (
          payload?.map((entry, i) => (
            <li
              key={`item-${i}`}
              className="capitalize flex gap-x-1 items-center text-default-600"
            >
              <span
                className={cn("w-2.5 h-2.5 rounded-full", {
                  "bg-success": entry.value === "income",
                  "bg-danger": entry.value === "expences",
                })}
              ></span>
              <span>{entry.value}</span>
            </li>
          ))
        ) : (
          <li>No Data</li>
        )}
      </ul>
    </div>
  );
}
