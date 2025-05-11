import { useRouter } from "next/navigation";
import { Card } from "@heroui/card";
import { cn } from "@heroui/theme";
import { Link } from "@heroui/link";
import { Skeleton } from "@heroui/skeleton";
import { Progress } from "@heroui/progress";
import { useGetBudgets } from "@/features/budgets/hooks";
import { Icon } from "@iconify/react";
import { Budget } from "@/data/budgets";
import { convertAmountFromMilliunits } from "@/lib/utils";
import { Button } from "@heroui/button";

export default function Budgets() {
  const { data: budgets, isLoading } = useGetBudgets();
  const router = useRouter();
  const handleRedirect = () => {
    router.push("/budgets?create=new_budget");
  };
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
        <div className="flex flex-col gap-y-5">
          <Skeleton className="w-44 h-5 rounded flex" />
          <Skeleton className="w-60 h-3 rounded flex" />
        </div>
      ) : (
        <h3 className="text-small font-medium text-default-500">My Budgets</h3>
      )}
      <div className="mt-3 flex-col flex gap-y-2">
        {!!budgets?.length ? (
          budgets.map((budget: Budget) => renderBudget(budget))
        ) : isLoading ? null : (
          <div className="flex justify-between items-center flex-col md:flex-row gap-y-4">
            <div className="text-default-500 text-sm">
              You have no added Budgets yet
            </div>
            <Button
              size="sm"
              color="primary"
              className="w-full md:w-auto"
              startContent={<Icon icon="solar:add-circle-bold" width={20} />}
              onPress={handleRedirect}
            >
              Add Budget
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
