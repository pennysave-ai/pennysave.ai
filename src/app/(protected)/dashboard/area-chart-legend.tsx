import { cn } from "@heroui/theme";

interface AreaChartLegendProps {
  payload?: {
    [x: string]: any; // eslint-disable-line
    value: string;
  }[];
  isEmptyData: boolean;
}
export default function AreaChartLegend({
  payload,
  isEmptyData,
}: AreaChartLegendProps) {
  return (
    <div className="flex justify-end pl-16">
      <ul className="flex flex-wrap justify-end p-3 text-sm list-none gap-2 bg-default/40 rounded-bl-[14px]">
        {!isEmptyData ? (
          payload?.map((entry, i) => (
            <li
              key={`item-${i}`}
              className="capitalize flex gap-x-2 items-center text-default-600"
            >
              <span
                className={cn("w-2.5 h-2.5 rounded-full")}
                style={{
                  backgroundColor: entry?.payload?.stroke,
                }}
              ></span>
              <span>{entry.value.replaceAll("_", " ")}</span>
            </li>
          ))
        ) : (
          <li>No Data</li>
        )}
      </ul>
    </div>
  );
}
