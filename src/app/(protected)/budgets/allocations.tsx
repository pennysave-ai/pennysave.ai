import { Progress } from "@heroui/progress";
import { cn } from "@heroui/theme";
import { convertAmountFromMilliunits } from "@/lib/utils";
import { BudgetAllocations } from "@/data/budgets";

interface AllocationProps {
  allocations: BudgetAllocations[];
  currencyName: string;
}
export default function Allocations({ allocations }: AllocationProps) {
  return allocations.map(({ name, allocatedAmount, categoryId, spent }) => {
    const percentage =
      allocatedAmount > 0 ? (spent / allocatedAmount) * 100 : 0;
    return (
      <div key={categoryId} className="flex items-center justify-between">
        <Progress
          classNames={{
            track: "border border-default",
            indicator: cn([
              "bg-gradient-to-r",
              percentage > 100
                ? "from-danger-300 to-danger-500"
                : "from-primary-500 to-secondary-500",
            ]),
            label: "text-default-600 capitalize",
            value: "text-foreground/60",
          }}
          label={name}
          radius="sm"
          showValueLabel={true}
          valueLabel={
            <div className="flex gap-x-1 text-xs">
              <div>{`${percentage.toFixed(2)}%`}</div>
            </div>
          }
          size="sm"
          value={convertAmountFromMilliunits(spent)}
          maxValue={convertAmountFromMilliunits(allocatedAmount)}
        />
      </div>
    );
  });
}
