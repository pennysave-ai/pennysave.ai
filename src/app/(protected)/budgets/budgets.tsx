"use client";

import { useState } from "react";
import CurrencyInput from "react-currency-input-field";
import { cn } from "@heroui/theme";

import { now } from "@internationalized/date";
// import { Icon } from "@iconify/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
// import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/modal";
import { DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/drawer";
// import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Input, Textarea } from "@heroui/input";
// import { DatePicker } from "@heroui/date-picker";
// import { today, getLocalTimeZone } from "@internationalized/date";

import { RightSidebar } from "@/components/common";
import { Delete } from "@/app/icons";
import { createTransactionsSchema } from "@/schemas";
import {
  // useGetTransactions,
  useDeleteTransaction,
  useCreateTransaction,
  useUpdateTransaction,
  type TransactionResponseItem,
} from "@/features/transactions/hooks";
// import { useGetAccounts } from "@/features/accounts/hooks";
// import { useGetCategories } from "@/features/categories/hooks";
import {
  convertAmountToMilliunits,
  // convertAmountFromMilliunits,
  // parseDateTime,
} from "@/lib/utils";
// import AmountInput from "@/components/amount-input";
// import { Budget } from "@prisma/client";

export function Budgets() {
  const { isOpen, onOpenChange } = useDisclosure();
  const [formError, setFormError] = useState<Record<string, string[]>>({});
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  // const { data, isLoading } = useGetTransactions();
  const deleteTransaction = useDeleteTransaction();
  const [formState] = useState<
    Omit<TransactionResponseItem, "amount"> & {
      amount: string;
    }
  >({
    id: "",
    amount: "",
    payee: "",
    notes: "",
    createdAt: now("UTC").toDate().toISOString(),
    account: {
      id: "",
      name: "",
      currency: {
        symbol: "",
        name: "",
      },
      last4: "",
      institution: {
        name: "",
      },
    },
    category: {
      id: "",
      name: "",
    },
  });
  const onCreate = async () => {
    const { amount, payee, notes, account, category, createdAt } = formState;
    const convertedAmount = convertAmountToMilliunits(parseFloat(amount)) || 0;
    const validationResult = createTransactionsSchema.safeParse({
      amount: convertedAmount,
      payee,
      notes,
      accountId: account.id,
      categoryId: category.id,
      createdAt,
    });
    if (!validationResult?.success) {
      setFormError(validationResult.error.flatten().fieldErrors);
      return;
    } else {
      setFormError({});
      await createTransaction.mutateAsync({
        amount: convertedAmount,
        payee,
        notes,
        accountId: account.id,
        categoryId: category.id || null,
        createdAt,
      });
      onOpenChange();
    }
  };

  const onUpdate = async () => {
    const { amount, payee, notes, account, category, createdAt } = formState;
    const convertedAmount = convertAmountToMilliunits(parseFloat(amount)) || 0;

    const validationResult = createTransactionsSchema.safeParse({
      amount: convertedAmount,
      payee,
      notes,
      accountId: account.id,
      categoryId: category.id,
      createdAt,
    });
    if (!validationResult?.success) {
      setFormError(validationResult.error.flatten().fieldErrors);
      return;
    } else {
      setFormError({});
      await updateTransaction.mutateAsync({
        id: formState.id,
        amount: convertedAmount,
        payee: formState.payee,
        notes: formState.notes,
        accountId: formState.account.id,
        categoryId: formState.category.id || null,
        createdAt: formState.createdAt,
      });
      onOpenChange();
    }
  };

  const onDelete = async () => {
    if (formState.id) {
      await deleteTransaction.mutateAsync([formState.id]);
      onOpenChange();
    }
  };
  return (
    <>
      <div className="flex px-4 w-full justify-center">
        <div className="-mt-[72px] grid grid-cols-1 gap-5 md:grid-cols-1 lg:grid-cols-3 max-w-screen-2xl mx-auto px-4 w-full">
          <Card className="w-full max-w-lg p-2">
            <CardHeader className="justify-between px-4">
              <Button color="primary" onPress={onOpenChange}>
                Create
              </Button>
            </CardHeader>
            <CardBody className="space-y-2 px-6"></CardBody>
          </Card>
          <Card className="w-full max-w-lg p-2">
            <CardHeader className="justify-between px-4">
              <div className="flex flex-col items-start">
                <p className="text-large">Food</p>
                <p className="text-small text-default-500">My food spendings</p>
              </div>
              <Button color="primary">Edit</Button>
            </CardHeader>
            <CardBody className="space-y-2 px-6"></CardBody>
          </Card>
        </div>
      </div>
      <RightSidebar isOpen={isOpen} onOpenChange={onOpenChange}>
        <DrawerHeader className="flex flex-col pb-2">
          Create a new Budget
        </DrawerHeader>
        <DrawerBody>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Fill the form below to create a new budget
          </div>
          <Input
            label="Name"
            isRequired
            autoFocus
            name="name"
            placeholder="e.g Food"
            type="text"
            variant="bordered"
            validationBehavior="aria"
            // value={formState.name}
            // onChange={(e) =>
            //   setFormState({ ...formState, name: e.target.value })
            // }
          />
          <Textarea
            maxLength={160}
            name="description"
            variant="bordered"
            className="mt-2"
            label="Description"
            placeholder="Budget description"
            validationBehavior="aria"
            // value={formState.description}
            // onChange={(e) =>
            //   setFormState({ ...formState, description: e.target.value })
            // }
          />
          <p className="text-small text-default-500 text-right">
            {/* {formState?.description?.length}/160 */}
          </p>
          <CurrencyInput
            id="amount"
            maxLength={12}
            aria-label="Amount"
            // prefix={prefix}
            // value={value}
            // onValueChange={(value) => onChange(value)}
            // disabled={disabled}
            placeholder="0.00"
            className={cn([
              "bg-transparent w-full px-3 py-2 relative inline-flex tap-highlight-transparent shadow-sm border-medium border-default-200 data-[hover=true]:border-default-400 group-data-[focus=true]:border-default-foreground min-h-10 rounded-medium flex-col items-start justify-center gap-0 !duration-150 transition-colors motion-reduce:transition-none h-14",
              formError?.totalAmount && "!border-danger",
            ])}
          />
          {/* <Autocomplete
          isRequired
          isInvalid={!!formError?.accountId}
          errorMessage={formError?.accountId?.join(", ")}
          defaultSelectedKey={
            formState.id ? formState.account.id : accountsData?.data[0]?.id
          }
          onValueChange={(value) => {
            setFormState({
              ...formState,
              account: {
                ...formState.account,
                name: value,
              },
            });
          }}
          onSelectionChange={(id) => {
            setFormState({
              ...formState,
              account: {
                ...formState.account,
                id: (id as string) || "",
                name: accountsData?.data.find((a) => a.id === id)?.name || "",
                currency: {
                  symbol:
                    accountsData?.data.find((a) => a.id === id)
                      ?.currencySymbol || "",
                  name:
                    accountsData?.data.find((a) => a.id === id)?.currency || "",
                },
              },
            });
          }}
          isDisabled={isAccountsDataLoading}
          endContent={isAccountsDataLoading}
          defaultItems={
            accountsData?.data.map(({ id, name, currency }) => ({
              key: id,
              label: `${name} (${currency})`,
            })) || []
          }
          label="Account"
          variant="bordered"
        >
          {(item) => (
            <AutocompleteItem key={item.key}>{item.label}</AutocompleteItem>
          )}
        </Autocomplete>
        <Autocomplete
          isInvalid={!!formError?.categoryId}
          errorMessage={formError?.categoryId?.join(", ")}
          onValueChange={(value) => {
            setFormState({
              ...formState,
              category: {
                ...formState.category,
                name: value,
              },
            });
          }}
          onSelectionChange={(id) => {
            setFormState({
              ...formState,
              category: {
                id: (id as string) || "",
                name: categoriesData?.data.find((a) => a.id === id)?.name || "",
              },
            });
          }}
          isDisabled={isCategoriesDataLoading}
          endContent={isCategoriesDataLoading}
          defaultSelectedKey={
            formState.id
              ? (formState.category.id as string)
              : (categoriesData?.data[0]?.id as string)
          }
          defaultItems={
            categoriesData?.data.map(({ id, name }) => ({
              key: id,
              label: name,
            })) || []
          }
          label="Category"
          variant="bordered"
        >
          {(item) => (
            <AutocompleteItem key={item.key}>{item.label}</AutocompleteItem>
          )}
        </Autocomplete>
        <DatePicker
          hourCycle={24}
          isRequired
          hideTimeZone
          maxValue={today(getLocalTimeZone())}
          showMonthAndYearPickers
          label="Transaction Date"
          variant="bordered"
          isInvalid={!!formError?.createdAt}
          errorMessage={formError?.createdAt?.join(", ")}
          value={parseDateTime(formState.createdAt)}
          onChange={(date) => {
            if (date) {
              const isoDateTime = date.toDate().toISOString();
              setFormState({
                ...formState,
                createdAt: isoDateTime,
              });
            }
          }}
        />
        <Input
          label="Payee"
          name="payee"
          placeholder="Payee info"
          type="text"
          variant="bordered"
          validationBehavior="aria"
          value={formState.payee}
          onChange={(e) =>
            setFormState({ ...formState, payee: e.target.value })
          }
        />
        <AmountInput
          placeholder="0.00"
          value={formState.amount.toString()}
          onChange={(v) => {
            setFormState({ ...formState, amount: v || "" });
          }}
          isInvalid={!!formError?.amount}
          errorMessage={formError?.amount?.join(", ")}
          prefix={formState.account.currency.symbol}
        />
        <Textarea
          maxLength={160}
          name="notes"
          variant="bordered"
          className="mt-2"
          label="Notes"
          placeholder="An additional notes for this transaction."
          validationBehavior="aria"
          value={formState.notes}
          onChange={(e) =>
            setFormState({ ...formState, notes: e.target.value })
          }
        />
        <p className="text-small text-default-500 text-right">
          {formState?.notes?.length}/160
        </p> */}
        </DrawerBody>
        <DrawerFooter>
          <div className="flex flex-col w-full">
            <Button
              color="primary"
              className="w-full"
              isLoading={
                createTransaction.isPending || updateTransaction.isPending
              }
              onPress={formState.id ? onUpdate : onCreate}
            >
              {formState.id ? "Update" : "Create"}
            </Button>
            {formState.id && (
              <Button
                color="danger"
                className="w-full mt-2"
                onPress={onDelete}
                isLoading={deleteTransaction.isPending}
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
