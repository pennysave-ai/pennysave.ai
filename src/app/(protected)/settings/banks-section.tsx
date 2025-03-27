"use client";

import { useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
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
import { Account } from "@/features/accounts/hooks";
import { useDeleteStripeAccounts } from "@/features/stripe/hooks";
import StripeLink from "./stripe-link";

import { Chip } from "@heroui/chip";

import SectionLoading from "./section-loading";

interface BanksSectionProps {
  hasActiveSubscription: boolean;
  accounts?: {
    data: Account[] | [];
    meta: {
      count: number;
    } | null;
  };
  isLoading: boolean;
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

export default function BanksSection({
  hasActiveSubscription,
  accounts,
  isLoading,
}: BanksSectionProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [institutionToDelete, setInstitutionToDelete] = useState<string>("");
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const { onOpen: onPaywallModalOpen } = useModal();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const deleteStripeAccounts = useDeleteStripeAccounts();

  // Group banks by institution
  const banks = accounts?.data
    .filter((account) => account.institution.last4)
    .reduce<
      {
        bankName: string;
        account: { name: string; last4: string | null }[];
      }[]
    >((acc, account) => {
      const bank = acc.find(
        (bank) => bank.bankName === account.institution.name
      );
      if (bank) {
        bank.account.push({
          name: account.name,
          last4: account.institution.last4,
        });
        return acc;
      } else {
        acc.push({
          bankName: account.institution.name || "",
          account: [
            {
              name: account.name,
              last4: account.institution.last4,
            },
          ],
        });
      }
      return acc;
    }, []);
  const handleDeleteItem = async () => {
    setIsDeleteLoading(true);
    await deleteStripeAccounts.mutateAsync(institutionToDelete);
    setIsDeleteLoading(false);
    onOpenChange();
  };
  if (isLoading)
    return (
      <SectionLoading
        icon={<Icon icon="solar:wallet-money-outline" width={32} />}
      />
    );

  if (!!banks?.length) {
    return (
      <Elements stripe={stripePromise}>
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
                <StripeLink
                  className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent data-[pressed=true]:scale-[0.97] outline-none data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 px-4 min-w-20 h-10 text-small gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] transition-transform-colors-opacity motion-reduce:transition-none bg-primary text-primary-foreground data-[hover=true]:opacity-hover w-full md:w-auto"
                  title="Connect"
                  startContent={
                    <Icon icon="solar:add-circle-bold" width={20} />
                  }
                  hasActiveSubscription={hasActiveSubscription}
                  openPaywall={onPaywallModalOpen}
                />
              </div>
            }
          >
            <div className="flex flex-col">
              {banks.map((bank, i) => (
                <div
                  key={i}
                  className="flex justify-between items-start md:items-center hover:none md:hover:bg-default-100 p-2 rounded-[8px] transition-colors duration-300 ease-in-out truncate flex-col md:flex-row gap-y-4 md:gap-y-0"
                >
                  <div className="flex items-center gap-x-3 overflow-hidden w-full">
                    <div className="bank-card bg-secondary-400">
                      {bank?.bankName[0]?.toUpperCase()}
                    </div>
                    <div className="flex flex-col overflow-hidden text-ellipsis">
                      <div className="truncate block">{bank.bankName}</div>
                      <div className="flex gap-x-2 text-xs text-default-400">
                        {bank.account.map((account, i) => (
                          <div key={i} className="trucate block">
                            *{account.last4}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-x-2 flex-col md:flex-row gap-y-3 md:gap-y-0 w-full md:w-auto">
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
                        setInstitutionToDelete(bank.bankName);
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
            setInstitutionToDelete("");
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
                      {institutionToDelete}
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
      </Elements>
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
        <Elements stripe={stripePromise}>
          <StripeLink
            className="w-full md:w-auto"
            title="Connect"
            startContent={<Icon icon="solar:add-circle-bold" width={20} />}
            hasActiveSubscription={hasActiveSubscription}
            openPaywall={onPaywallModalOpen}
          />
        </Elements>
      </div>
    </CardBody>
  );
}
