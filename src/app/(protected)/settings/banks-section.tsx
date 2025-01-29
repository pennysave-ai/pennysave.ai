"use client";

import { useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Icon } from "@iconify/react";
import { useModal } from "@/app/providers/modal";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  useDisclosure,
} from "@heroui/modal";
import PlaidLink from "./plaid-link";
import { Link } from "@heroui/link";
import { Chip } from "@heroui/chip";

import { useDeletePlaidItem } from "@/features/plaidItems/hooks";
import SectionLoading from "./section-loading";

interface Bank {
  name: string;
  url: string;
  color: string;
  id: string;
}

interface BanksSectionProps {
  hasActiveSubscription: boolean;
  banks: Bank[];
  isLoading: boolean;
}

export default function BanksSection({
  hasActiveSubscription,
  banks,
  isLoading,
}: BanksSectionProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [plaidItemToDelete, setPlaidItemToDelete] = useState<string>("");
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const { onOpen: onPaywallModalOpen } = useModal();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const deleteItem = useDeletePlaidItem();

  const handleDeleteItem = async () => {
    setIsDeleteLoading(true);
    await deleteItem.mutateAsync([plaidItemToDelete]);
    setIsDeleteLoading(false);
    onOpenChange();
  };

  const bankNameToDelete =
    banks?.find((bank) => bank.id === plaidItemToDelete)?.name || "";

  if (isLoading)
    return (
      <SectionLoading
        icon={<Icon icon="solar:wallet-money-outline" width={32} />}
      />
    );

  if (!!banks.length) {
    return (
      <>
        <Accordion variant="bordered" className="overflow-hidden">
          <AccordionItem
            className="py-0.5"
            key="1"
            aria-label="Connected banks"
            startContent={<Icon icon="solar:wallet-money-outline" width={32} />}
            title={
              <div className="flex justify-between items-center">
                <div className="gap-y-2 flex">
                  <div>Connected banks</div>
                  <Chip
                    className="items-center text-default-500 ml-1 w-min-[10px]"
                    size="sm"
                    variant="flat"
                  >
                    {banks.length}
                  </Chip>
                </div>
                <PlaidLink
                  className="w-auto hidden md:flex"
                  title="Connect"
                  startContent={
                    <Icon icon="solar:add-circle-bold" width={20} />
                  }
                />
              </div>
            }
          >
            <PlaidLink
              className="w-full md:hidden mb-3"
              title="Connect"
              startContent={<Icon icon="solar:add-circle-bold" width={20} />}
            />
            <div className="flex flex-col">
              {banks.map((bank, i) => (
                <div
                  key={i}
                  className="flex justify-between items-start md:items-center hover:none md:hover:bg-default-100 p-2 rounded-[8px] transition-colors duration-300 ease-in-out truncate flex-col md:flex-row gap-y-4 md:gap-y-0"
                >
                  <div className="flex items-center gap-x-3 overflow-hidden w-full">
                    <div
                      className="bank-card"
                      style={{
                        background: bank.color,
                      }}
                    >
                      {bank.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex flex-col overflow-hidden text-ellipsis">
                      <div className="truncate block">{bank.name}</div>
                      <Link
                        isExternal
                        size="sm"
                        href={bank.url || ""}
                        className="truncate block"
                      >
                        {bank.url}
                      </Link>
                    </div>
                  </div>
                  <div className="flex gap-x-2 flex-col md:flex-row gap-y-3 md:gap-y-0 w-full md:w-auto">
                    <PlaidLink
                      plaidItemId={bank.id}
                      className="md:flex w-full"
                      variant={isMobile ? "flat" : "light"}
                    />
                    <Button
                      isIconOnly
                      fullWidth
                      className="md:flex w-full"
                      size="sm"
                      aria-label="remove bank"
                      color="danger"
                      variant={isMobile ? "flat" : "light"}
                      onPress={() => {
                        onOpen();
                        setPlaidItemToDelete(bank.id);
                      }}
                    >
                      <Icon icon="solar:close-circle-bold" width={22} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </AccordionItem>
        </Accordion>
        <Modal
          isOpen={isOpen}
          onOpenChange={() => {
            setPlaidItemToDelete("");
            onOpenChange();
          }}
          backdrop="opaque"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Delete connected Bank
                </ModalHeader>
                <ModalBody className="text-default-500">
                  <div>
                    You are about to delete connection with
                    <span className="text-primary ml-1">
                      {bankNameToDelete}
                    </span>
                    . All transactions and accounts associated with this bank
                    will be removed. Are you sure you want to continue?
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Close
                  </Button>
                  <Button
                    color="primary"
                    data-delete="bulk"
                    isLoading={isDeleteLoading}
                    onPress={handleDeleteItem}
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
  return (
    <CardBody className="p-0">
      <div className="flex items-start md:items-center flex-col md:flex-row gap-y-2 md:gap-y-0 justify-between bg-none rounded-medium p-4 border-medium border-divider">
        <div className="flex items-center gap-x-2">
          <Icon icon="solar:wallet-money-outline" width={32} />
          <div>
            Connected bank accounts
            <div className="text-small text-default-500 flex gap-x-1 flex-col md:flex-row">
              Add your bank card to track your transactions automatically.
            </div>
          </div>
        </div>
        {hasActiveSubscription ? (
          <PlaidLink className="w-full md:w-auto" title="Connect" />
        ) : (
          <Button
            className="w-full md:w-auto"
            color="primary"
            onPress={onPaywallModalOpen}
          >
            Connect
          </Button>
        )}
      </div>
    </CardBody>
  );
}
