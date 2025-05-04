import { Card } from "@heroui/card";
import { cn } from "@heroui/theme";
import { Link } from "@heroui/link";
import { Skeleton } from "@heroui/skeleton";
import { Progress } from "@heroui/progress";
import { useGetBudgets } from "@/features/budgets/hooks";
import { Icon } from "@iconify/react";
import { Budget } from "@/data/budgets";
import { convertAmountFromMilliunits } from "@/lib/utils";

export default function Budgets() {
  const { data: budgets, isLoading } = useGetBudgets();
  const renderBudget = (budget: Budget) => {
    const percentage =
      budget.totalAmount > 0
        ? ((budget?.totalTransactions ?? 0) / budget.totalAmount) * 100
        : 0;
    return (
      <div key={budget.id} className="flex">
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
          label={
            <div className="flex items-center gap-x-1">
              <Link
                underline="hover"
                size="sm"
                color="foreground"
                href="/budgets"
              >
                {budget.name}
              </Link>
              {budget.enableNotifications && <Icon icon="solar:bell-bold" />}
            </div>
          }
          radius="sm"
          showValueLabel={true}
          valueLabel={
            <div className="flex gap-x-1 text-xs">
              <div>{`${percentage.toFixed(2)}%`}</div>
            </div>
          }
          size="sm"
          value={convertAmountFromMilliunits(budget?.totalTransactions || 0)}
          maxValue={convertAmountFromMilliunits(budget.totalAmount)}
        />
      </div>
    );
  };
  return (
    <Card
      as="dl"
      className="border border-transparent dark:border-default-100 lg:col-span-2 md:col-span-1 p-4"
    >
      {isLoading ? (
        <Skeleton className="w-44 h-5 rounded" />
      ) : (
        <h3 className="text-small font-medium text-default-500">My Budgets</h3>
      )}
      <div className="mt-3 flex-col flex gap-y-2">
        {budgets?.map((budget: Budget) => renderBudget(budget))}
      </div>
    </Card>
  );
}
