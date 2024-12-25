"use client";

import { useState, useEffect } from "react";
import { Button } from "@nextui-org/button";
import { Icon } from "@iconify/react";
import { Card } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { useDisclosure } from "@nextui-org/modal";
import { DrawerHeader, DrawerBody, DrawerFooter } from "@nextui-org/drawer";
import CategoriesTable from "./categories-table";
import { RightSidebar } from "@/components/common";
import { Delete } from "@/app/icons";
import {
  useCreateCategory,
  type Category,
  useGetCategories,
  useDeleteCategory,
  useUpdateCategory,
} from "@/features/categories/hooks";
import { Input, Textarea } from "@nextui-org/input";

const CategoriesCard = () => {
  const { data, isLoading } = useGetCategories();
  const deleteCategory = useDeleteCategory();
  const updateCategory = useUpdateCategory();
  const createCategory = useCreateCategory();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [formState, setFormState] = useState<{
    id: null | string;
    name: string;
    description: string;
  }>({
    id: null,
    name: "",
    description: "",
  });

  useEffect(() => {
    if (!isOpen) {
      setFormState({ id: "", name: "", description: "" });
    }
  }, [isOpen]);

  const onOpenSidebar = (account: Category) => {
    setFormState(account);
    onOpenChange();
  };
  const handleCreate = async () => {
    await createCategory.mutateAsync(formState);
    onOpenChange();
  };
  const handleUpdate = async () => {
    await updateCategory.mutateAsync(formState);
    onOpenChange();
  };

  const onDeleteCategory = async () => {
    if (formState.id) {
      await deleteCategory.mutateAsync([formState.id]);
      onOpenChange();
    }
  };

  return (
    <Card className="-mt-24 w-full p-8 max-w-screen-2xl">
      <div className="flex sm:flex-row flex-col justify-between">
        <div className="flex items-center sm:mb-0 mb-4">
          <h1 className="text-2xl font-[700] leading-[32px]">My Categories</h1>
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
          Add New Category
        </Button>
        <RightSidebar isOpen={isOpen} onOpenChange={onOpenChange}>
          <DrawerHeader className="flex flex-col pb-2">
            {formState.id ? "Edit" : "Create a new"} Category
          </DrawerHeader>
          <DrawerBody>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formState.id
                ? "Edit an exisitng category"
                : "Create a new category to manage your transactions"}
            </div>
            <Input
              name="name"
              placeholder="e.g Food, Rent, Salary"
              type="text"
              variant="bordered"
              validationBehavior="aria"
              value={formState.name}
              onChange={(e) =>
                setFormState({ ...formState, name: e.target.value })
              }
            />
            <Textarea
              maxLength={160}
              name="description"
              variant="bordered"
              className="mt-2"
              label="Description"
              placeholder="Optional: Add an additional description for this category. Max 160 characters"
              validationBehavior="aria"
              value={formState.description}
              onChange={(e) =>
                setFormState({ ...formState, description: e.target.value })
              }
            />
          </DrawerBody>
          <DrawerFooter>
            <div className="flex flex-col w-full">
              <Button
                color="primary"
                className="w-full"
                isDisabled={formState.name.length < 3}
                isLoading={createCategory.isPending || updateCategory.isPending}
                onPress={formState.id ? handleUpdate : handleCreate}
              >
                {formState.id ? "Update" : "Create"}
              </Button>
              {formState.id && (
                <Button
                  color="danger"
                  className="w-full mt-2"
                  onPress={onDeleteCategory}
                  isLoading={deleteCategory.isPending}
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
      <CategoriesTable
        categories={data?.data || []}
        isLoading={isLoading}
        onOpenSidebar={onOpenSidebar}
      />
    </Card>
  );
};
export default CategoriesCard;
