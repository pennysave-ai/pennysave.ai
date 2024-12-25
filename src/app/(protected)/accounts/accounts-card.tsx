"use client";

import { useState, useEffect } from "react";
import { Button } from "@nextui-org/button";
import { Icon } from "@iconify/react";
import { Card } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { useDisclosure } from "@nextui-org/modal";
import { DrawerHeader, DrawerBody, DrawerFooter } from "@nextui-org/drawer";
import AccountsTable from "./accounts-table";
import { RightSidebar } from "@/components/common";
import { Delete } from "@/app/icons";
import {
  useCreateAccount,
  type Account,
  useGetAccounts,
  useDeleteAccount,
  useUpdateAccount,
} from "@/features/accounts/api";
import { Input } from "@nextui-org/input";

const AccountsCard = () => {
  const { data, isLoading } = useGetAccounts();
  const deleteAccounts = useDeleteAccount();
  const updateAccount = useUpdateAccount();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [formState, setFormState] = useState<{
    id: null | string;
    name: string;
  }>({
    id: null,
    name: "",
  });

  useEffect(() => {
    if (!isOpen) {
      setFormState({ id: "", name: "" });
    }
  }, [isOpen]);
  const createAccount = useCreateAccount();

  const onOpenSidebar = (account: Account) => {
    setFormState(account);
    onOpenChange();
  };
  const handleCreate = async () => {
    await createAccount.mutateAsync(formState);
    onOpenChange();
  };
  const handleUpdate = async () => {
    await updateAccount.mutateAsync(formState);
    onOpenChange();
  };

  const deleteAccount = async () => {
    if (formState.id) {
      await deleteAccounts.mutateAsync([formState.id]);
      onOpenChange();
    }
  };

  return (
    <Card className="-mt-24 w-full p-8 max-w-screen-2xl">
      <div className="flex sm:flex-row flex-col justify-between">
        <div className="flex items-center sm:mb-0 mb-4">
          <h1 className="text-2xl font-[700] leading-[32px]">All Accounts</h1>
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
          Add New Account
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
            <Input
              name="name"
              placeholder="e.g Cash or Bank account, Credit Card"
              type="text"
              variant="bordered"
              validationBehavior="aria"
              value={formState.name}
              onChange={(e) =>
                setFormState({ ...formState, name: e.target.value })
              }
            />
          </DrawerBody>
          <DrawerFooter>
            <div className="flex flex-col w-full">
              <Button
                color="primary"
                className="w-full"
                isDisabled={formState.name.length < 3}
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
                    <div>Delete</div>
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
