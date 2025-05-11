"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { RadioGroup } from "@heroui/radio";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { useModal } from "@/app/providers/modal";
import { Icon } from "@iconify/react";
import PlanRadio from "./plan-radio";
import { STRIPE_PLANS } from "@/lib/stripe";
import { useCreateCheckoutSession } from "@/features/stripe/hooks";

const PAID_FEATURES = [
  { id: 1, name: "Enable Monthly email reports." },
  {
    id: 2,
    name: "Enable email notifications then your budget is exceeded.",
  },
  {
    id: 3,
    name: "Connect your bank card, to track your transactions automatically.",
  },
  // { id: 4, name: "Create a sharebale accounts to track your family budgets" },
];

export const PaywallModal = () => {
  const { isOpen, onClose } = useModal();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const createCheckoutSession = useCreateCheckoutSession();
  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const session = await createCheckoutSession.mutateAsync(selected!);
      setLoading(false);
      if (session.url) {
        window.location.href = session.url;
      } else {
        console.error("Failed to create checkout session");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      backdrop="opaque"
      classNames={{
        backdrop: "z-10",
      }}
    >
      <ModalContent>
        <ModalHeader className="mt-2">
          <div className="flex items-center gap-x-1">
            <Icon icon="solar:box-minimalistic-linear" width={32} />
            Subscribe to the <span className="text-primary">Paid Plan</span>
          </div>
        </ModalHeader>
        <ModalBody>
          Get access to all premium features. Cancel anytime.
          <ul className="list-disc list-inside text-sm mb-2">
            {PAID_FEATURES.map((feature) => (
              <li key={feature.id} className="text-default-500">
                <Icon icon="sm:che" width={32} />
                {feature.name}
              </li>
            ))}
          </ul>
          <RadioGroup
            aria-label="Plans"
            classNames={{ wrapper: "gap-3" }}
            value={selected}
            onValueChange={setSelected}
          >
            {STRIPE_PLANS.map((plan) => {
              if (plan?.perk) {
                return (
                  <Badge
                    key={plan.priceId}
                    showOutline
                    classNames={{
                      badge:
                        "z-10 bg-primary-50 border-small text-primary border-primary-200 right-5 px-2 py-1",
                    }}
                    content="Popular"
                    size="sm"
                    variant="flat"
                  >
                    <PlanRadio
                      key={plan.priceId}
                      label={plan.name}
                      price={`$${plan.price}${plan.duration}`}
                      value={plan.priceId || ""}
                      description={plan.perk}
                    />
                  </Badge>
                );
              }
              return (
                <PlanRadio
                  key={plan.priceId}
                  label={plan.name}
                  price={`$${plan.price}${plan.duration}`}
                  value={plan.priceId || ""}
                  description={plan.perk}
                />
              );
            })}
          </RadioGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Close
          </Button>
          <Button
            color="primary"
            variant="solid"
            onPress={handleSubscribe}
            isDisabled={!selected}
            isLoading={loading}
          >
            Subscribe
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
