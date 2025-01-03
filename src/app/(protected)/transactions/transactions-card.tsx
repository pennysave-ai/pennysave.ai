"use client";

import { useState, useEffect } from "react";

import { format, parseISO } from "date-fns";
import { Button } from "@nextui-org/button";
import { Icon } from "@iconify/react";
import { Card } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { useDisclosure } from "@nextui-org/modal";
import { Input, Textarea } from "@nextui-org/input";
import { DatePicker } from "@nextui-org/date-picker";
import { now, getLocalTimeZone } from "@internationalized/date";
import { DrawerHeader, DrawerBody, DrawerFooter } from "@nextui-org/drawer";
import TransactionsTable from "./transactions-table";
import { RightSidebar } from "@/components/common";
import { Delete } from "@/app/icons";
import {
  useGetTransactions,
  useDeleteTransaction,
  useCreateTransaction,
  useUpdateTransaction,
  type Transaction,
} from "@/features/transactions/hooks";
import { useGetAccounts } from "@/features/accounts/hooks";
import { useGetCategories } from "@/features/categories/hooks";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import AmountInput from "@/components/amount-input";
import {
  CalendarDateTime,
  ZonedDateTime,
  toZoned,
} from "@internationalized/date";
import { createTransactionsSchema } from "@/schemas";
import {
  convertAmountToMilliunits,
  convertAmountFromMilliunits,
} from "@/lib/utils";
import { symbol } from "zod";

// Function to parse ISO 8601 string to CalendarDate
export const parseDateTime = (dateString: string): ZonedDateTime => {
  const localTime = format(
    parseISO(dateString),
    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
  );
  const date = new Date(localTime);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO 8601 date time string: ${dateString}`);
  }
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // Months are zero-based in JS Date
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();
  const millisecond = date.getUTCMilliseconds();

  const dateTime = new CalendarDateTime(
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond
  );
  return toZoned(dateTime, getLocalTimeZone());
};

const TransactionsCard = () => {
  const { data, isLoading } = useGetTransactions();
  const deleteTransaction = useDeleteTransaction();
  const updateTransaction = useUpdateTransaction();
  const createTransaction = useCreateTransaction();
  const { data: accountsData, isLoading: isAccountsDataLoading } =
    useGetAccounts();
  console.log("accountsData", accountsData);
  const { data: categoriesData, isLoading: isCategoriesDataLoading } =
    useGetCategories();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [formState, setFormState] = useState<
    Omit<Transaction, "amount"> & {
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
      },
    },
    category: {
      id: "",
      name: "",
    },
  });

  const [formError, setFormError] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!isOpen) {
      setFormState({
        ...formState,
        id: "",
        amount: "",
        payee: "",
        notes: "",
        account: {
          id: "",
          name: "",
          currency: {
            symbol: "",
          },
        },
        category: {
          id: "",
          name: "",
        },
      });
    } else {
      if (formState.id) {
        setFormState({
          ...formState,
          createdAt: formState.createdAt,
        });
      } else {
        setFormState({
          ...formState,
          account: {
            name: accountsData?.data[0]?.name || "",
            id: accountsData?.data[0]?.id || "",
            currency: {
              symbol: accountsData?.data[0]?.currency.symbol || "",
            },
          },
          category: {
            name: categoriesData?.data[0]?.name || "",
            id: categoriesData?.data[0]?.id || "",
          },
          createdAt: now("UTC").toDate().toISOString(),
        });
      }
    }
  }, [isOpen]);

  const onOpenSidebar = (transaction: Transaction) => {
    const { id, amount, payee, notes, createdAt, account, category } =
      transaction;
    const convertedAmount = convertAmountFromMilliunits(amount).toString();
    setFormState({
      id,
      amount: convertedAmount,
      payee,
      notes,
      createdAt,
      account: {
        id: account.id,
        name: account.name,
        currency: {
          symbol: account.currency.symbol,
        },
      },
      category: {
        id: category.id,
        name: category.name,
      },
    });
    onOpenChange();
  };
  const handleCreate = async () => {
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
        categoryId: category.id,
        createdAt,
      });
      onOpenChange();
    }
  };
  const handleUpdate = async () => {
    const convertedAmount =
      convertAmountToMilliunits(parseFloat(formState.amount)) || 0;
    await updateTransaction.mutateAsync({
      id: formState.id,
      amount: convertedAmount,
      payee: formState.payee,
      notes: formState.notes,
      accountId: formState.account.id,
      categoryId: formState.category.id,
      createdAt: formState.createdAt,
    });
    onOpenChange();
  };

  const onDeleteCategory = async () => {
    if (formState.id) {
      await deleteTransaction.mutateAsync([formState.id]);
      onOpenChange();
    }
  };

  return (
    <Card className="-mt-24 w-full p-8 max-w-screen-2xl">
      <div className="flex sm:flex-row flex-col justify-between">
        <div className="flex items-center sm:mb-0 mb-4">
          <h1 className="text-2xl font-[700] leading-[32px]">
            Transactions History
          </h1>
          <Chip
            className="items-center text-default-500 ml-1 w-min-[10px]"
            size="sm"
            variant="flat"
          >
            {data?.meta?.count}
          </Chip>
        </div>
        <Button
          color="primary"
          endContent={<Icon icon="solar:add-circle-bold" width={20} />}
          onPress={onOpen}
        >
          Add New Transaction
        </Button>
        <RightSidebar isOpen={isOpen} onOpenChange={onOpenChange}>
          <DrawerHeader className="flex flex-col pb-2">
            {formState.id ? "Edit" : "Create a new"} Transaction
          </DrawerHeader>
          <DrawerBody>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formState.id
                ? "Edit transaction details"
                : "Fill the form below to create a new transaction"}
            </div>
            <Autocomplete
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
                    id: (id as string) || "",
                    name:
                      accountsData?.data.find((a) => a.id === id)?.name || "",
                    currency: {
                      symbol:
                        accountsData?.data.find((a) => a.id === id)?.currency
                          .symbol || "",
                    },
                  },
                });
              }}
              isDisabled={isAccountsDataLoading}
              endContent={isAccountsDataLoading}
              defaultItems={
                accountsData?.data.map(({ id, name, currency }) => ({
                  key: id,
                  label: `${name} (${currency.name})`,
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
              isRequired
              isInvalid={!!formError?.categoryId}
              errorMessage={formError?.categoryId?.join(", ")}
              defaultSelectedKey={
                formState.id
                  ? formState.category.id
                  : categoriesData?.data[0]?.id
              }
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
                    name:
                      categoriesData?.data.find((a) => a.id === id)?.name || "",
                  },
                });
              }}
              isDisabled={isCategoriesDataLoading}
              endContent={isCategoriesDataLoading}
              className=""
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
            </p>
          </DrawerBody>
          <DrawerFooter>
            <div className="flex flex-col w-full">
              <Button
                color="primary"
                className="w-full"
                isLoading={
                  createTransaction.isPending || updateTransaction.isPending
                }
                onPress={formState.id ? handleUpdate : handleCreate}
              >
                {formState.id ? "Update" : "Create"}
              </Button>
              {formState.id && (
                <Button
                  color="danger"
                  className="w-full mt-2"
                  onPress={onDeleteCategory}
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
      </div>
      <TransactionsTable
        transactions={data?.data || []}
        isLoading={isLoading}
        onOpenSidebar={onOpenSidebar}
      />
    </Card>
  );
};
export default TransactionsCard;
