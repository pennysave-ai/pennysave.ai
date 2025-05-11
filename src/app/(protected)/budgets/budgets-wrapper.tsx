"use client";

import { useState } from "react";
import Budgets from "./budgets";
import {
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { useDeleteBudget } from "@/features/budgets/hooks";
import { Button } from "@heroui/button";

export default function BudgetsWrapper({
  hasActiveSubscription,
}: {
  hasActiveSubscription: boolean;
}) {
  const { isOpen, onOpenChange } = useDisclosure();
  const deleteBudget = useDeleteBudget();
  const [selectedBudget, setSelectedBudget] = useState<{
    id: string;
    name: string;
  }>({
    id: "",
    name: "",
  });
  const onDeleteModalOpen = async (id: string, name: string) => {
    setSelectedBudget({ id, name });
    onOpenChange();
  };

  const handleDeleteBudget = async () => {
    await deleteBudget.mutateAsync(selectedBudget.id);
    onOpenChange();
  };

  return (
    <>
      <Budgets
        onDeleteModalOpen={onDeleteModalOpen}
        hasActiveSubscription={hasActiveSubscription}
      />
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="opaque">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Delete</ModalHeader>
              <ModalBody>
                <p>
                  You are about to delete
                  <strong> {selectedBudget.name}</strong> budget. Are you sure
                  you want to proceed?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  data-delete="bulk"
                  isLoading={deleteBudget.isPending}
                  onPress={handleDeleteBudget}
                >
                  Yes
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
