"use client";
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { now } from "@internationalized/date";
import { Button } from "@heroui/button";
import { DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/drawer";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Input, Textarea } from "@heroui/input";
import { DatePicker } from "@heroui/date-picker";
import { today, getLocalTimeZone } from "@internationalized/date";
import { RightSidebar } from "@/components/common";
import { createTransactionsSchema } from "@/schemas";
import {
  useDeleteTransaction,
  useCreateTransaction,
  useUpdateTransaction,
  type TransactionResponseItem,
} from "@/features/transactions/hooks";
import { useGetAccounts } from "@/features/accounts/hooks";
import { useGetCategories } from "@/features/categories/hooks";
import { Delete } from "@/app/icons";
import {
  parseDateTime,
  convertAmountToMilliunits,
  convertAmountFromMilliunits,
} from "@/lib/utils";
import AmountInput from "@/components/amount-input";

interface SidebarProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

const Sidebar = forwardRef(({ isOpen, onOpenChange }: SidebarProps, ref) => {
  const deleteTransaction = useDeleteTransaction();
  const updateTransaction = useUpdateTransaction();
  const createTransaction = useCreateTransaction();
  const { data: accountsData, isLoading: isAccountsDataLoading } =
    useGetAccounts();
  const { data: categoriesData, isLoading: isCategoriesDataLoading } =
    useGetCategories();
  const [formError, setFormError] = useState<Record<string, string[]>>({});
  const [formState, setFormState] = useState<
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
              symbol: accountsData?.data[0]?.currencySymbol || "",
              name: accountsData?.data[0]?.currency || "",
            },
            last4: accountsData?.data[0]?.institution.last4 || "",
            institution: {
              name: accountsData?.data[0]?.institution.name || "",
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
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const onOpenSidebar = (transaction: TransactionResponseItem) => {
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
          name: account.currency.name,
        },
        last4: account.last4,
        institution: {
          name: account?.institution.name,
        },
      },
      category: {
        id: category?.id ? category.id : "",
        name: category?.name ? category.name : "",
      },
    });
    onOpenChange();
  };

  useImperativeHandle(ref, () => ({
    openSidebar: (transaction: TransactionResponseItem) => {
      onOpenSidebar(transaction);
    },
  }));

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
  );
});

Sidebar.displayName = "Sidebar";
export default Sidebar;
