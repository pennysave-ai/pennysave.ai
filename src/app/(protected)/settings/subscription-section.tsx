"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { CardBody } from "@heroui/card";
import { STRIPE_PLANS } from "@/lib/stripe";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/button";
import SubscriptionButton from "./subscription-button";
import { Accordion, AccordionItem } from "@heroui/accordion";
import SectionLoading from "./section-loading";

export default function SubscriptionSection() {
  const { data, status } = useSession();
  const [selectedKeys, setSelectedKeys] = useState(new Set([""]));
  if (status === "loading" || !data?.user) {
    return (
      <SectionLoading
        icon={<Icon icon="solar:box-minimalistic-linear" width={32} />}
      />
    );
  }
  // if User has a subscription
  if ("subscription" in data.user) {
    const { user } = data;
    const handleManageSubscription = () => {
      // open stripe manage subscription in a new window
      window.open(
        `https://billing.stripe.com/p/login/${process.env.NEXT_PUBLIC_STRIPE_MANAGE_ID}?prefilled_email=${user.email}`,
        "_blank"
      );
    };
    const subscription = STRIPE_PLANS.find(
      (plan) => plan.priceId === user.subscription?.priceId
    );
    return (
      <CardBody className="p-0">
        <div className="flex items-start md:items-center flex-col md:flex-row gap-y-2 md:gap-y-0 justify-between bg-none rounded-medium p-4 border-medium border-divider">
          <div className="flex items-center gap-x-2 overflow-hidden w-full">
            <div>
              <Icon icon="solar:box-minimalistic-linear" width={32} />
            </div>
            <div className="truncate">
              Current Plan:
              <div className="text-small text-default-500 flex gap-x-1 flex-col md:flex-row">
                <div className="text-success">
                  ${subscription?.price}
                  {subscription?.duration}
                </div>
                <div className="truncate">
                  <div
                    className={
                      user.subscription?.cancelAt
                        ? "text-default-500"
                        : "truncate"
                    }
                  >
                    {user.subscription?.cancelAt
                      ? "will be canceled on"
                      : "renews on"}{" "}
                    {(user.subscription?.cancelAt ||
                      user.subscription?.expires) &&
                      format(
                        new Date(
                          user.subscription?.cancelAt ||
                            user.subscription?.expires
                        ),
                        "PP"
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Button
            className="w-full md:w-auto"
            color="primary"
            onPress={handleManageSubscription}
          >
            Manage
          </Button>
        </div>
      </CardBody>
    );
  }
  return (
    <Accordion
      className="overflow-hidden"
      variant="bordered"
      selectedKeys={selectedKeys}
      onSelectionChange={(keys) =>
        setSelectedKeys(new Set(Array.from(keys).map(String)))
      }
    >
      <AccordionItem
        className="p-0"
        key="1"
        aria-label="Subscriptions"
        startContent={<Icon icon="solar:box-minimalistic-linear" width={32} />}
        subtitle={
          <div className="flex items-center">
            Subscribe now to get access to all premium features. Cancel anytime.
          </div>
        }
        title="Subscriptions"
      >
        <div className="grid grid-col-1">
          {STRIPE_PLANS.map((plan) => (
            <div
              key={plan.priceId}
              className="flex items-center justify-between hover:bg-default-100 p-2 rounded-[8px] transition-colors duration-300 ease-in-out truncate"
            >
              <div>
                ${plan.price}
                {plan.duration}
              </div>
              <div>
                <SubscriptionButton
                  key={plan.priceId}
                  priceId={plan.priceId || ""}
                />
              </div>
            </div>
          ))}
        </div>
      </AccordionItem>
    </Accordion>
  );
}
