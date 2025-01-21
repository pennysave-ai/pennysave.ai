"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import { useDisclosure } from "@heroui/modal";
import { DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/drawer";
import AccountsTable from "./accounts-table";
import { RightSidebar } from "@/components/common";
import { Delete } from "@/app/icons";
import {
  useCreateAccount,
  type Account,
  useGetAccounts,
  useDeleteAccount,
  useUpdateAccount,
} from "@/features/accounts/hooks";
import { Input } from "@heroui/input";
import {
  useGetCurrencies,
  type CurrencyItem,
} from "@/features/currencies/hooks";
import { accountSchema } from "@/schemas";

const AccountsCard = () => {
  const { data, isLoading } = useGetAccounts();
  const { data: currencies, isLoading: isCurrenciesLoading } =
    useGetCurrencies();
  const deleteAccounts = useDeleteAccount();
  const updateAccount = useUpdateAccount();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [formState, setFormState] = useState<{
    id: null | string;
    name: string;
    currencyId: string;
  }>({
    id: null,
    name: "",
    currencyId: "",
  });
  const [formError, setFormError] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!isOpen) {
      setFormState({ id: "", name: "", currencyId: "" });
      setFormError({});
    }
  }, [isOpen]);

  const createAccount = useCreateAccount();

  const onOpenSidebar = (account: Account) => {
    setFormState({
      id: account.id,
      name: account.name,
      currencyId: account.currencyId,
    });
    onOpenChange();
  };
  const handleCreate = async () => {
    const validationResult = accountSchema.safeParse({
      name: formState.name,
      currencyId: formState.currencyId,
    });
    if (!validationResult.success) {
      setFormError(validationResult.error.flatten().fieldErrors);
      return;
    } else {
      setFormError({});
      await createAccount.mutateAsync({
        name: formState.name,
        currencyId: formState?.currencyId || "",
      });
      onOpenChange();
    }
  };
  const handleUpdate = async () => {
    const validationResult = accountSchema.safeParse({
      name: formState.name,
      currencyId: formState.currencyId,
    });
    if (!validationResult.success) {
      setFormError(validationResult.error.flatten().fieldErrors);
      return;
    } else {
      setFormError({});
      await updateAccount.mutateAsync(formState);
      onOpenChange();
    }
  };

  const deleteAccount = async () => {
    if (formState.id) {
      await deleteAccounts.mutateAsync([formState.id]);
      onOpenChange();
    }
  };

  return (
    <Card className="-mt-[72px] w-full p-8 max-w-screen-2xl">
      <div className="flex sm:flex-row flex-col justify-between">
        <div className="flex items-center sm:mb-0 mb-4">
          <h1 className="text-2xl font-[700] leading-[32px]">My Accounts</h1>
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
          Add New
        </Button>
        <RightSidebar isOpen={isOpen} onOpenChange={onOpenChange}>
          <DrawerHeader className="flex flex-col pb-2">
            {formState.id ? "Edit" : "Create a new"} Account
          </DrawerHeader>
          <DrawerBody>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formState.id
                ? "Edit an exisitng account"
                : "Create a new account to track your transactions"}
            </div>
            <div className="gap-3 flex flex-col">
              <Input
                autoFocus
                label="Name"
                isRequired
                name="name"
                placeholder="e.g Cash or Bank account, Credit Card"
                type="text"
                variant="bordered"
                validationBehavior="aria"
                value={formState.name}
                onChange={(e) =>
                  setFormState({ ...formState, name: e.target.value })
                }
                isInvalid={!!formError?.name}
                errorMessage={formError?.name?.join(", ")}
              />
              {currencies && currencies?.data && (
                <Select
                  isInvalid={!!formError?.currencyId}
                  errorMessage={formError?.currencyId?.join(", ")}
                  variant="bordered"
                  isLoading={isCurrenciesLoading}
                  label="Account Currency"
                  isRequired
                  defaultSelectedKeys={[formState?.currencyId || ""]}
                  onChange={({ target }) => {
                    setFormState({
                      ...formState,
                      currencyId: target.value,
                    });
                  }}
                >
                  {currencies.data.map((currency: CurrencyItem) => (
                    <SelectItem key={currency.id}>{currency.name}</SelectItem>
                  ))}
                </Select>
              )}
            </div>
          </DrawerBody>
          <DrawerFooter>
            <div className="flex flex-col w-full">
              <Button
                color="primary"
                className="w-full"
                isLoading={createAccount.isPending || updateAccount.isPending}
                onPress={formState.id ? handleUpdate : handleCreate}
              >
                {formState.id ? "Update" : "Create"}
              </Button>
              {formState.id && (
                <Button
                  color="danger"
                  className="w-full mt-2"
                  onPress={deleteAccount}
                  isLoading={deleteAccounts.isPending}
                >
                  <div className="flex align-middle text-white">
                    <Delete
                      height={18}
                      width={18}
                      stroke="currentColor"
                      className="mr-1"
                    />
                    Delete
                  </div>
                </Button>
              )}
            </div>
          </DrawerFooter>
        </RightSidebar>
      </div>
      <AccountsTable
        accounts={data?.data || []}
        isLoading={isLoading}
        onOpenSidebar={onOpenSidebar}
      />
    </Card>
  );
};
export default AccountsCard;
