import { Budget } from "@/data/budgets";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import { Badge } from "@heroui/badge";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/theme";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Spinner } from "@heroui/spinner";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { convertAmountFromMilliunits, formatCurrency } from "@/lib/utils";
import {
  useToggleBudgetNotifications,
  useDeleteBudget,
} from "@/features/budgets/hooks";
import { BASE_CURRENCY } from "@/constants";
import Allocations from "./allocations";

interface BudgetCardProps {
  budget: Budget;
  currencies?: { id: string; name: string }[];
  openSideBar: (budget: Budget) => void;
  onDeleteModalOpen: (id: string, name: string) => void;
}
export default function BudgetCard({
  budget,
  openSideBar,
  currencies = [],
  onDeleteModalOpen,
}: BudgetCardProps) {
  const toggleBudgetNotifications = useToggleBudgetNotifications();
  const deleteBudget = useDeleteBudget();
  const isCategoryAllocationEnabled = budget.budgetAllocations.some(
    (category) => category.allocatedAmount > 0
  );
  const totalAmount = convertAmountFromMilliunits(budget.totalAmount);
  const totalTransactions = convertAmountFromMilliunits(
    budget.totalTransactions!
  );
  const percentage =
    totalAmount > 0 ? (totalTransactions / totalAmount) * 100 : 0;
  const currencyName =
    currencies.find((currency) => currency.id === budget.currencyId)?.name ||
    BASE_CURRENCY;
  const handleEnableNotifications = async () => {
    toggleBudgetNotifications.mutate({
      id: budget.id!,
      enable: !budget.enableNotifications,
    });
  };

  return (
    <Card key={budget.id} className="w-full max-w-lg p-2 h-min">
      <CardHeader className="justify-between px-4 gap-x-2">
        <Badge
          isOneChar
          isInvisible={!budget.enableNotifications}
          color="primary"
          showOutline={false}
          content={
            budget.enableNotifications ? <Icon icon="solar:bell-bold" /> : null
          }
          placement="top-right"
          shape="circle"
        >
          <div className="relative">
            {(toggleBudgetNotifications.isPending ||
              deleteBudget.isPending) && (
              <Spinner
                classNames={{
                  wrapper: "!w-14 !h-14",
                }}
                className="absolute top-0 left-0 !w-14 !h-14"
                size="lg"
                color={deleteBudget.isPending ? "danger" : "primary"}
              />
            )}
            <div
              className={cn([
                "flex flex-0 items-center justify-center !w-14 !h-14 rounded-full bg-default-100",
                percentage > 100 ? "text-danger" : "text-default-900",
              ])}
            >
              <Icon icon={budget.icon} width={24} />
            </div>
          </div>
        </Badge>
        <div className="flex items-start gap-x-2 flex-1 overflow-hidden whitespace-nowrap text-ellipsis">
          <div className="flex flex-col overflow-hidden whitespace-nowrap text-ellipsis">
            <div className="flex text-large gap-x-2"> {budget.name}</div>
            <div className="text-small text-default-500 overflow-hidden whitespace-nowrap text-ellipsis">
              {budget.description}
            </div>
          </div>
        </div>
        <div className="flex items-center flex-0 self-start">
          <Dropdown
            classNames={{
              content: "min-w-[120px]",
            }}
            placement="bottom-end"
          >
            <DropdownTrigger>
              <Button
                isIconOnly
                className="absolute right-2 top-2 w-auto rounded-full"
                variant="light"
              >
                <Icon height={16} icon="solar:menu-dots-bold" width={16} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu variant="flat">
              <DropdownItem
                key="enable-notfications"
                startContent={<Icon icon="solar:bell-bold" />}
                onPress={handleEnableNotifications}
              >
                {budget.enableNotifications ? "Disable" : "Enable"}{" "}
                Notifications
              </DropdownItem>
              <DropdownItem
                key="edit"
                startContent={<Icon icon="solar:pen-2-bold" />}
                onPress={() => openSideBar(budget)}
              >
                Edit
              </DropdownItem>
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                startContent={<Icon icon="solar:close-circle-bold" />}
                onPress={() => onDeleteModalOpen(budget.id!, budget.name)}
              >
                Delete
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </CardHeader>
      <CardBody className="space-y-2 px-4">
        {isCategoryAllocationEnabled ? (
          <Accordion className="p-0">
            <AccordionItem
              key="1"
              aria-label="Accordion 1"
              className="p-0"
              classNames={{
                trigger: "p-0",
              }}
              title={
                <Progress
                  classNames={{
                    labelWrapper: "flex items-end justify-between",
                    track: "border border-default",
                    indicator: cn([
                      "bg-gradient-to-r",
                      percentage > 100
                        ? "from-danger-300 to-danger-500"
                        : "from-primary-500 to-secondary-500",
                    ]),
                    label:
                      "tracking-wider font-medium text-default-600 capitalize",
                    value: "text-foreground/60",
                  }}
                  label={`${budget.frequency.toLowerCase()} Budget`}
                  radius="sm"
                  showValueLabel={true}
                  valueLabel={
                    <div className="flex gap-x-1 text-xs">
                      <div>Spent</div>
                      <div>{`${percentage.toFixed(2)}%`}</div>
                      <div>/</div>
                      <div>
                        {formatCurrency(totalTransactions, currencyName)}
                      </div>
                      <div>of</div>
                      <div>{formatCurrency(totalAmount, currencyName)}</div>
                    </div>
                  }
                  size="sm"
                  value={totalTransactions}
                  maxValue={totalAmount}
                />
              }
            >
              <div className="flex flex-col gap-y-2 mt-2">
                <Allocations
                  allocations={budget.budgetAllocations}
                  currencyName={currencyName}
                />
              </div>
            </AccordionItem>
          </Accordion>
        ) : (
          <Progress
            classNames={{
              labelWrapper: "flex items-end justify-between",
              track: "border border-default",
              indicator: cn([
                "bg-gradient-to-r",
                percentage > 100
                  ? "from-danger-300 to-danger-500"
                  : "from-primary-500 to-secondary-500",
              ]),
              label: "tracking-wider font-medium text-default-600 capitalize",
              value: "text-foreground/60",
            }}
            label={`${budget.frequency.toLowerCase()} Budget`}
            radius="sm"
            showValueLabel={true}
            valueLabel={
              <div className="flex gap-x-1 text-xs">
                <div>Spent</div>
                <div>{`${percentage.toFixed(2)}%`}</div>
                <div>/</div>
                <div>{formatCurrency(totalTransactions, currencyName)}</div>
                <div>of</div>
                <div>{formatCurrency(totalAmount, currencyName)}</div>
              </div>
            }
            size="sm"
            value={totalTransactions}
            maxValue={totalAmount}
          />
        )}
      </CardBody>
    </Card>
  );
}
