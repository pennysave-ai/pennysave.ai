import { cn } from "@heroui/theme";
import { convertAmountFromMilliunits } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface AmountCellProps {
  amount: number;
  currency: string;
}

export function AmountCell({ amount, currency }: AmountCellProps) {
  const convertedAmount = convertAmountFromMilliunits(amount);
  return (
    <div
      className={cn("truncate max-w-[30vw]", {
        "text-danger": convertedAmount < 0,
        "text-success": convertedAmount > 0,
      })}
    >
      {formatCurrency(convertedAmount, currency)}
    </div>
  );
}
