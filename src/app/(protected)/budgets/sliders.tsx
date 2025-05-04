import { Slider } from "@heroui/slider";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/theme";

import { type CurrencyItem } from "@/features/currencies/hooks";

type BudgetAllocation = {
  categoryId: string;
  allocatedAmount: string;
  name: string;
};

interface SlidersProps {
  allocations: BudgetAllocation[];
  totalAmount: string;
  currency?: CurrencyItem;
  error?: string;
  handleDelete: (categoryId: string) => void;
  handleChange: (categoryId: string, value: number) => void;
}

export default function Sliders({
  allocations,
  totalAmount,
  currency,
  error,
  handleDelete,
  handleChange,
}: SlidersProps) {
  const totalAllocations = allocations.reduce(
    (acc, { allocatedAmount }) => acc + parseFloat(allocatedAmount),
    0
  );
  const toAllocate = parseFloat(totalAmount) - totalAllocations;
  return (
    <>
      <div className="flex text-sm text-default-500 gap-x-2">
        <div>Amount to allocate:</div>
        <div
          className={cn(
            "text-default-600 font-semibold",
            toAllocate > 0 ? "text-danger" : "text-success"
          )}
        >{`${currency?.symbol}${Math.abs(toAllocate || 0).toFixed(0)}`}</div>
      </div>
      {error && <div className="text-danger text-xs">{error}</div>}
      {allocations.map(({ name, categoryId, allocatedAmount }) => {
        return (
          <div
            key={categoryId}
            className="flex items-center justify-between mt-2 gap-x-2"
          >
            <div className="relative w-full flex items-center">
              <Slider
                className="max-w-md"
                defaultValue={0}
                label={
                  <div className="flex">
                    <div className="text-default-600 text-small">{name}</div>
                  </div>
                }
                formatOptions={{
                  style: "currency",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                  currency: currency?.name,
                }}
                maxValue={totalAmount ? parseFloat(totalAmount) : 0}
                value={parseFloat(allocatedAmount) || 0}
                onChange={(value) => {
                  if (typeof value === "number") {
                    handleChange(categoryId, value);
                  }
                }}
                step={1}
              />
            </div>
            <Button
              isIconOnly
              size="sm"
              color="danger"
              aria-label="delete category"
              variant="light"
              onPress={() => {
                handleDelete(categoryId);
              }}
            >
              <Icon icon="solar:close-circle-bold" width={22} />
            </Button>
          </div>
        );
      })}
    </>
  );
}
