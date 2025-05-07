"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@heroui/skeleton";
import CurrencyInput from "react-currency-input-field";
import { cn } from "@heroui/theme";
import { BudgetFrequency } from "@prisma/client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Tab, Tabs } from "@heroui/tabs";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/modal";
import { DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/drawer";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { RightSidebar } from "@/components/common";
import { Checkbox } from "@heroui/checkbox";
import { Delete } from "@/app/icons";
import { Icon } from "@iconify/react";
import { createBudgetSchema } from "@/schemas";
import { useGetCurrencies } from "@/features/currencies/hooks";
import { useGetCategories } from "@/features/categories/hooks";
import { useGetAccounts } from "@/features/accounts/hooks";
import {
  useCreateBudget,
  useDeleteBudget,
  useGetBudgets,
  useUpdateBudget,
} from "@/features/budgets/hooks";
import {
  convertAmountToMilliunits,
  convertAmountFromMilliunits,
} from "@/lib/utils";
import { BASE_CURRENCY } from "@/constants";
import { Budget } from "@/data/budgets";

import Sliders from "./sliders";
import BudgetCard from "./budget-card";
import IconPicker from "./icon-picker";

interface BudgetsProps {
  onDeleteModalOpen: (id: string, name: string) => void;
}

type BudgetState = {
  id: string;
  name: string;
  totalAmount: string;
  frequency: BudgetFrequency;
  description: string;
  currencyId: string;
  icon: string;
  enableNotifications: boolean;
  accounts: Set<string>;
  budgetAllocations:
    | []
    | {
        categoryId: string;
        allocatedAmount: string;
        name: string;
        spent: number;
      }[];
};

export function Budgets({ onDeleteModalOpen }: BudgetsProps) {
  const { isOpen, onOpenChange } = useDisclosure();
  const { data: currencyData, isLoading: isCurrencyLoading } =
    useGetCurrencies();
  const { data: accountData, isLoading: isAccountsLoading } = useGetAccounts();
  const { data: categoriesData, isLoading: isCategoriesDataLoading } =
    useGetCategories();
  const [formError, setFormError] = useState<Record<string, string[]>>({});
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();
  const { data: budgetsData, isLoading: isBudgetsLoading } = useGetBudgets();
  const [formState, setFormState] = useState<BudgetState>({
    id: "",
    name: "",
    totalAmount: "",
    enableNotifications: false,
    frequency: "MONTHLY",
    icon: "solar:menu-dots-bold",
    description: "",
    currencyId: "",
    accounts: new Set(["all"]),
    budgetAllocations: [],
  });
  const [amountByCategories, setAmountByCategories] = useState<boolean>(false);
  useEffect(() => {
    if (currencyData) {
      setFormState((prevState) => ({
        ...prevState,
        currencyId: currencyData?.data?.filter(
          ({ name }) => name.toLocaleLowerCase() === BASE_CURRENCY
        )[0].id,
      }));
    }
  }, [currencyData]);

  useEffect(() => {
    if (accountData) {
      setFormState((prevState) => ({
        ...prevState,
        accounts: new Set([...accountData?.data?.map(({ id }) => id), "all"]),
      }));
    }
  }, [accountData]);

  useEffect(() => {
    if (categoriesData) {
      setFormState((prevState) => ({
        ...prevState,
        budgetAllocations: [
          ...(categoriesData?.data.map(({ id, name }) => ({
            categoryId: id,
            allocatedAmount: "0,00",
            name,
            spent: 0,
          })) || []),
          {
            categoryId: "all",
            allocatedAmount: "",
            name: "All",
            spent: 0,
          },
        ],
      }));
    }
  }, [categoriesData]);

  useEffect(() => {
    if (!isOpen) {
      setAmountByCategories(false);
    }
  }, [isOpen]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openSideBar = (budget?: any) => {
    if (budget) {
      setFormState((prevState) => ({
        ...prevState,
        id: budget.id,
        name: budget.name,
        totalAmount: convertAmountFromMilliunits(budget.totalAmount).toString(),
        frequency: budget.frequency,
        icon: budget.icon,
        enableNotifications: budget.enableNotifications,
        description: budget.description,
        currencyId: budget.currencyId,
        accounts: new Set(budget.accounts),
        budgetAllocations: budget.budgetAllocations.map(
          ({
            categoryId,
            allocatedAmount,
            name,
            spent,
          }: {
            categoryId: string;
            allocatedAmount: string;
            name: string;
            spent: number;
          }) => ({
            categoryId,
            allocatedAmount: convertAmountFromMilliunits(
              Number(allocatedAmount)
            ).toString(),
            name,
            spent,
          })
        ),
      }));
      if (
        budget.budgetAllocations.some(
          ({ allocatedAmount }: { allocatedAmount: number }) =>
            Number(allocatedAmount) > 0
        )
      ) {
        setAmountByCategories(true);
      }
    } else {
      setFormState((prevState) => ({
        ...prevState,
        id: "",
        name: "",
        totalAmount: "",
        frequency: "WEEKLY",
        description: "",
        icon: "solar:menu-dots-bold",
        enableNotifications: false,
        currencyId: prevState.currencyId,
        accounts: accountData
          ? new Set([...accountData?.data?.map(({ id }) => id), "all"])
          : new Set([]),
        budgetAllocations: [
          ...(categoriesData?.data.map(({ id, name }) => ({
            categoryId: id,
            allocatedAmount: "0.00",
            name,
            spent: 0,
          })) || []),
          {
            categoryId: "all",
            allocatedAmount: "",
            name: "All",
            spent: 0,
          },
        ],
      }));
    }
    onOpenChange();
  };

  const onCreate = async () => {
    const {
      name,
      totalAmount,
      frequency,
      description,
      currencyId,
      accounts,
      budgetAllocations,
      icon,
      enableNotifications,
    } = formState;
    const convertedTotalAmount =
      convertAmountToMilliunits(parseFloat(totalAmount)) || 0;
    const payload = {
      name,
      totalAmount: convertedTotalAmount,
      frequency,
      description,
      currencyId,
      icon,
      enableNotifications,
      allocateByCategories: amountByCategories,
      accounts: Array.from(accounts).filter((id) => id !== "all"),
      budgetAllocations: budgetAllocations
        .filter(({ categoryId }) => categoryId !== "all")
        .map(({ categoryId, allocatedAmount, name }) => ({
          name,
          categoryId,
          allocatedAmount: convertAmountToMilliunits(
            parseFloat(allocatedAmount || "0") || 0
          ),
          spent: 0,
        })),
    };
    const validationResult = createBudgetSchema.safeParse(payload);
    if (!validationResult.success) {
      setFormError(validationResult.error.flatten().fieldErrors);
      return;
    }
    setFormError({});
    await createBudget.mutateAsync(payload);
    onOpenChange();
  };

  const onUpdate = async () => {
    const {
      id,
      name,
      totalAmount,
      frequency,
      description,
      enableNotifications,
      icon,
      currencyId,
      accounts,
      budgetAllocations,
    } = formState;
    const convertedTotalAmount =
      convertAmountToMilliunits(parseFloat(totalAmount)) || 0;
    const payload = {
      name,
      totalAmount: convertedTotalAmount,
      frequency,
      description,
      enableNotifications,
      icon,
      currencyId,
      accounts: Array.from(accounts).filter((id) => id !== "all"),
      budgetAllocations: budgetAllocations
        .filter(({ categoryId }) => categoryId !== "all")
        .map(({ categoryId, allocatedAmount, name, spent }) => ({
          name,
          categoryId,
          allocatedAmount: convertAmountToMilliunits(
            parseFloat(allocatedAmount || "0") || 0
          ),
          spent,
        })),
    };
    const validationResult = createBudgetSchema.safeParse({
      ...payload,
      allocateByCategories: amountByCategories,
    });
    if (!validationResult.success) {
      setFormError(validationResult.error.flatten().fieldErrors);
      return;
    }
    setFormError({});
    await updateBudget.mutateAsync({
      ...payload,
      id,
      allocateByCategories: amountByCategories,
    });
    onOpenChange();
  };

  const onDelete = async () => {
    if (formState.id) {
      await deleteBudget.mutateAsync(formState.id);
      onOpenChange();
    }
  };

  const onNameChange = ({
    target,
  }: {
    target: EventTarget & HTMLInputElement;
  }) => {
    setFormState((prevState) => ({
      ...prevState,
      name: target.value,
    }));
  };

  const onCurrencyChange = ({
    target,
  }: {
    target: EventTarget & HTMLSelectElement;
  }) => {
    setFormState((prevState) => ({
      ...prevState,
      currencyId: target.value,
    }));
  };

  const onBudgetTypeChange = (key: string) => {
    const value = key as string;
    setFormState((prevState) => ({
      ...prevState,
      frequency: value as BudgetFrequency,
    }));
  };

  const handleSelectedAccountChange = (keys: Set<string>) => {
    if (keys.has("all")) {
      // If "all" is selected, select all accounts
      setFormState((prevState) => ({
        ...prevState,
        accounts: prevState.accounts.has("all")
          ? Array.from(keys).filter((key) => key != "all").length <
            (accountData?.data?.length || 0)
            ? new Set([...keys].filter((key) => key !== "all"))
            : new Set([...keys])
          : new Set([
              ...keys,
              ...(accountData?.data?.map(({ id }) => id) || []),
            ]),
      }));
    } else {
      // If "all" is not selected, update the accounts
      setFormState((prevState) => {
        return {
          ...prevState,
          accounts: prevState.accounts.has("all")
            ? new Set()
            : Array.from(keys).filter((key) => key != "all").length ==
              accountData?.data.length
            ? new Set([...keys, "all"])
            : new Set([...keys]),
        };
      });
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectedCategoryChange = (keys: any) => {
    const allocationAmount = keys.has("all")
      ? (
          parseFloat(totalAmount) / (categoriesData?.data?.length ?? 1)
        ).toString()
      : (parseFloat(totalAmount) / keys.size).toString();
    if (keys.has("all")) {
      // If "all" is selected, select all categories
      const budgetAllocations =
        categoriesData?.data.map(({ id, name }) => ({
          categoryId: id,
          allocatedAmount: amountByCategories ? allocationAmount : "0.00",
          name,
          spent: 0,
        })) || [];
      setFormState((prevState) => {
        const prevStateAllocationHasAll = prevState.budgetAllocations.some(
          (allocation) => allocation.categoryId === "all"
        );
        const allocations =
          categoriesData?.data?.filter(({ id }) =>
            Array.from(keys).includes(id)
          ) || [];
        return {
          ...prevState,
          budgetAllocations: prevStateAllocationHasAll
            ? allocations.map(({ id, name }) => ({
                categoryId: id,
                allocatedAmount: amountByCategories
                  ? Math.floor(
                      parseFloat(totalAmount) / allocations.length
                    ).toString()
                  : "0.00",
                name,
                spent: 0,
              })) || []
            : [
                ...budgetAllocations,
                {
                  categoryId: "all",
                  name: "All",
                  allocatedAmount: "0.00",
                  spent: 0,
                },
              ],
        };
      });
    } else {
      // If "all" is not selected, update the categories
      setFormState((prevState) => {
        const prevStateAllocationHasAll = prevState.budgetAllocations.some(
          (allocation) => allocation.categoryId === "all"
        );
        const allAllocations =
          categoriesData?.data.map(({ id, name }) => ({
            categoryId: id,
            allocatedAmount: amountByCategories ? allocationAmount : "0.00",
            name,
            spent: 0,
          })) || [];
        return {
          ...prevState,
          budgetAllocations: prevStateAllocationHasAll
            ? []
            : keys.size === categoriesData?.data.length
            ? [
                ...allAllocations,
                {
                  categoryId: "all",
                  name: "All",
                  allocatedAmount: "0.00",
                  spent: 0,
                },
              ]
            : categoriesData?.data
                ?.filter(({ id }) => Array.from(keys).includes(id))
                .map(({ id, name }) => ({
                  categoryId: id,
                  allocatedAmount: amountByCategories
                    ? allocationAmount
                    : "0.00",
                  name,
                  spent: 0,
                })) || [],
        };
      });
    }
  };

  const handleIconChange = (icon: string) => {
    setFormState((prevState) => ({
      ...prevState,
      icon,
    }));
  };

  const handleAmountByCategoriesChange = () => {
    if (!amountByCategories) {
      setFormState((prevState) => ({
        ...prevState,
        budgetAllocations: formState.budgetAllocations.map((allocation) => ({
          ...allocation,
          allocatedAmount: Math.floor(
            parseFloat(totalAmount) /
              prevState.budgetAllocations.filter(
                ({ categoryId }) => categoryId !== "all"
              ).length
          ).toString(), // Ensure allocationAmount is a string
        })),
      }));
    } else {
      setFormState((prevState) => ({
        ...prevState,
        budgetAllocations: prevState.budgetAllocations.map((allocation) => ({
          ...allocation,
          allocatedAmount: "0.00",
        })),
      }));
    }
    setAmountByCategories((prevState) => !prevState);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setFormState((prevState) => {
      const allocations = prevState.budgetAllocations.filter(
        (allocation) =>
          allocation.categoryId !== categoryId &&
          allocation.categoryId !== "all"
      );
      if (allocations.length === 0) {
        setAmountByCategories(false);
        return {
          ...prevState,
        };
      }
      return {
        ...prevState,
        budgetAllocations: prevState.budgetAllocations
          .filter(
            (allocation) =>
              allocation.categoryId !== categoryId &&
              allocation.categoryId !== "all"
          )
          .map((allocation) => ({
            ...allocation,
            allocatedAmount: Math.floor(
              parseFloat(totalAmount) / allocations.length
            ).toFixed(2), // Ensure allocationAmount is a string
          })),
      };
    });
  };

  const handleCategorySliderChange = (categoryId: string, newValue: number) => {
    setFormState((prevState) => {
      const newAllocations = prevState.budgetAllocations
        .filter(({ categoryId }) => categoryId !== "all")
        .map((allocation) => {
          if (allocation.categoryId === categoryId) {
            return {
              ...allocation,
              allocatedAmount: newValue.toString(),
            };
          }
          return allocation;
        });
      const newTotalAllocations = newAllocations.reduce(
        (acc, allocation) => acc + parseFloat(allocation.allocatedAmount),
        0
      );
      if (newTotalAllocations > parseFloat(prevState.totalAmount)) {
        const diff = newTotalAllocations - parseFloat(prevState.totalAmount);
        const updatedAllocations = newAllocations.map((allocation) => {
          if (allocation.categoryId === categoryId) {
            return {
              ...allocation,
              allocatedAmount: (
                parseFloat(allocation.allocatedAmount) - diff
              ).toFixed(2), // Ensure allocationAmount is a string
            };
          }
          return allocation;
        });
        return {
          ...prevState,
          budgetAllocations: updatedAllocations,
        };
      }
      return {
        ...prevState,
        budgetAllocations: newAllocations,
      };
    });
  };

  const handleNotificationChange = () => {
    setFormState((prevState) => ({
      ...prevState,
      enableNotifications: !prevState.enableNotifications,
    }));
  };

  const handleAmountChange = (value: string | undefined) => {
    let changedAllocations = formState.budgetAllocations;
    if (value) {
      changedAllocations = formState.budgetAllocations.map((allocation) => {
        const allocationAmount = Math.floor(
          parseFloat(value) /
            formState.budgetAllocations.filter(
              ({ categoryId }) => categoryId !== "all"
            ).length
        ).toString();
        return {
          ...allocation,
          allocatedAmount: amountByCategories ? allocationAmount : "0.00",
        };
      });
    }
    console.log("changedAllocations", changedAllocations);
    setFormState((prevState) => ({
      ...prevState,
      totalAmount: value || "",
      budgetAllocations: changedAllocations,
    }));
  };

  const {
    id,
    currencyId,
    name,
    accounts,
    totalAmount,
    budgetAllocations,
    description,
    icon,
    enableNotifications,
  } = formState;
  const currencyName = currencyData?.data.filter(
    ({ id }) => currencyId === id
  )[0];
  return (
    <>
      <div className="flex px-4 w-full justify-center">
        <div className="-mt-[72px] grid grid-cols-1 gap-5 md:grid-cols-1 lg:grid-cols-3 max-w-screen-2xl mx-auto px-4 w-full auto-columns-auto">
          <Card className="w-full max-w-lg p-2 h-min">
            <CardHeader className="flex justify-between px-4 gap-x-2">
              <div className="flex items-center justify-center !w-14 !h-14 rounded-full bg-default-100">
                <Icon icon="solar:calculator-linear" width={24} />
              </div>
              <div className="flex flex-1" />
            </CardHeader>
            <CardBody className="space-y-2 px-4 py-2">
              <Button
                color="primary"
                onPress={() => openSideBar()}
                startContent={<Icon icon="solar:add-circle-bold" width={20} />}
              >
                Create new Budget
              </Button>
            </CardBody>
          </Card>
          {isBudgetsLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="w-full max-w-lg p-2 h-min">
                  <CardHeader className="flex justify-between px-4 gap-x-2">
                    <Skeleton className="flex rounded-full w-14 h-14" />
                    <div className="flex flex-1">
                      <div className="flex flex-col w-full gap-y-2">
                        <Skeleton className="h-3 w-2/5 rounded-lg" />
                        <Skeleton className="h-3 w-4/5 rounded-lg" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="space-y-2 px-4">
                    <Skeleton className="h-8 w-full rounded-lg" />
                  </CardBody>
                </Card>
              ))
            : budgetsData?.map((budget: Budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  openSideBar={openSideBar}
                  currencies={currencyData?.data}
                  onDeleteModalOpen={onDeleteModalOpen}
                />
              ))}
        </div>
      </div>
      <RightSidebar isOpen={isOpen} onOpenChange={onOpenChange}>
        <DrawerHeader className="flex flex-col pb-2">
          {id ? "Update budget" : "Create a new Budget"}
        </DrawerHeader>
        <DrawerBody>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Fill the form below to {id ? "update the" : "create a new"} budget
          </div>
          <div className="relative">
            <Input
              label="Name"
              isRequired
              autoFocus
              name="name"
              placeholder="e.g Food"
              type="text"
              variant="bordered"
              validationBehavior="aria"
              isInvalid={!!formError?.name}
              errorMessage={formError?.name?.join(", ")}
              value={name}
              onChange={onNameChange}
            />
            <IconPicker pickedIcon={icon} onIconChange={handleIconChange} />
          </div>
          <div className="relative">
            <label className="absolute top-1 left-1.5 text-default-600 scale-85 text-small pb-0.5 pe-2 max-w-full text-ellipsis overflow-hidden after:content-['*'] after:text-danger after:ms-0.5 will-change-auto !duration-200">
              Total amount
            </label>
            <CurrencyInput
              id="amount"
              maxLength={12}
              aria-label="Amount"
              placeholder="0.00"
              value={totalAmount}
              onValueChange={handleAmountChange}
              allowDecimals={false}
              allowNegativeValue={false}
              className={cn([
                "bg-transparent w-full px-3 pb-2 pt-5 relative inline-flex tap-highlight-transparent shadow-sm border-medium border-default-200 data-[hover=true]:border-default-400 group-data-[focus=true]:border-default-foreground min-h-10 rounded-medium flex-col items-end justify-center gap-0 !duration-150 transition-colors motion-reduce:transition-none h-14",
                formError?.totalAmount && "!border-danger",
              ])}
            />
            {formError?.totalAmount && (
              <div className="text-xs text-danger mt-1">
                {formError?.totalAmount?.join(", ")}
              </div>
            )}
            <Select
              size="lg"
              radius="sm"
              className="max-w-[100px] absolute top-1 right-1 z-10"
              isDisabled={isCurrencyLoading}
              isLoading={isCurrencyLoading}
              disallowEmptySelection
              onChange={(value) => onCurrencyChange(value)}
              selectedKeys={[currencyId]}
            >
              <>
                {currencyData?.data.map(({ id, name }) => (
                  <SelectItem key={id}>{name}</SelectItem>
                ))}
              </>
            </Select>
          </div>
          <label htmlFor="budget-type" className="text-xs text-default-600">
            Budget type:
          </label>
          <Tabs
            fullWidth
            aria-label="budget-type"
            selectedKey={formState.frequency}
            onSelectionChange={(key) => onBudgetTypeChange(key as string)}
          >
            {Object.values(BudgetFrequency).map((frequency) => (
              <Tab
                key={frequency}
                title={
                  <div className="capitalize">{frequency.toLowerCase()}</div>
                }
              ></Tab>
            ))}
          </Tabs>
          <Select
            isRequired
            isDisabled={isAccountsLoading}
            isLoading={isAccountsLoading}
            className="w-full mt-2"
            label="Select accounts included in the budget"
            selectionMode="multiple"
            selectedKeys={accounts}
            onSelectionChange={(keys) =>
              handleSelectedAccountChange(keys as Set<string>)
            }
            renderValue={(selectedKeys) =>
              selectedKeys
                .filter(({ key }) => key !== "all")
                .map(({ textValue }) => textValue)
                .join(", ")
            }
            isInvalid={accounts.size === 0}
            errorMessage={formError?.accounts?.join(", ")}
          >
            <>
              <SelectItem key="all">All</SelectItem>
              {(accountData?.data || []).map(({ id, name }) => (
                <SelectItem key={id}>{name}</SelectItem>
              ))}
            </>
          </Select>
          <Select
            errorMessage="Please select at least one category"
            isRequired
            isDisabled={isAccountsLoading}
            isLoading={isAccountsLoading}
            className="mt-2"
            label="Categories included in the budget:"
            selectionMode="multiple"
            selectedKeys={budgetAllocations.map(({ categoryId }) => categoryId)}
            onSelectionChange={handleSelectedCategoryChange}
            renderValue={(selectedKeys) =>
              selectedKeys
                .filter(({ key }) => key !== "all")
                .map(({ textValue }) => textValue)
                .join(", ")
            }
          >
            <>
              <SelectItem key="all">All</SelectItem>
              {(categoriesData?.data || []).map(({ id, name }) => (
                <SelectItem key={id}>{name}</SelectItem>
              ))}
            </>
          </Select>
          <Checkbox
            size="sm"
            onChange={handleNotificationChange}
            isSelected={enableNotifications}
          >
            Enable email notifications when I exceed my budget
          </Checkbox>
          <Checkbox
            size="sm"
            isDisabled={
              isCategoriesDataLoading || budgetAllocations.length === 0
            }
            onChange={handleAmountByCategoriesChange}
            isSelected={amountByCategories}
          >
            Allocate the total amount to the picked categories
          </Checkbox>
          {amountByCategories && budgetAllocations.length > 0 && (
            <Sliders
              error={formError.budgetAllocations?.join(",") || ""}
              allocations={budgetAllocations.filter(
                ({ categoryId }) => categoryId !== "all"
              )}
              totalAmount={totalAmount}
              currency={currencyName}
              handleChange={handleCategorySliderChange}
              handleDelete={handleDeleteCategory}
            />
          )}
          <Textarea
            maxLength={160}
            name="description"
            variant="bordered"
            className="mt-2"
            label="Description"
            placeholder="Budget description"
            validationBehavior="aria"
            value={description}
            onChange={(e) => {
              setFormState((prevState) => ({
                ...prevState,
                description: e.target.value,
              }));
            }}
          />
        </DrawerBody>
        <DrawerFooter>
          <div className="flex flex-col w-full">
            <Button
              color="primary"
              className="w-full"
              isLoading={createBudget.isPending || updateBudget.isPending}
              onPress={formState.id ? onUpdate : onCreate}
            >
              {formState.id ? "Update" : "Create"}
            </Button>
            {formState.id && (
              <Button
                color="danger"
                className="w-full mt-2"
                onPress={onDelete}
                isLoading={deleteBudget.isPending}
              >
                <div className="flex align-middle text-white">
                  <Delete
                    height={18}
                    width={18}
                    stroke="currentColor"
                    className="mr-1"
                  />
                  <div>Delete</div>
                </div>
              </Button>
            )}
          </div>
        </DrawerFooter>
      </RightSidebar>
    </>
  );
}
export default Budgets;
