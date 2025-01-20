"use client";

import { Session } from "next-auth";
import { format } from "date-fns";
import { CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { STRIPE_PLANS } from "@/lib/stripe";
import { Icon } from "@iconify/react";
import SubscriptionButton from "./subscription-button";

interface GeneralProps {
  user: Session["user"];
}

// TODO: Add currency support
export default function General({ user }: GeneralProps) {
  const subscription = STRIPE_PLANS.find(
    (plan) => plan.priceId === user.subscription?.priceId
  );
  const handleManageSubscription = () => {
    window.location.href = `https://billing.stripe.com/p/login/${process.env.NEXT_PUBLIC_STRIPE_MANAGE_ID}?prefilled_email=${user.email}`;
  };
  return (
    <>
      <CardHeader className="flex flex-col items-start p-4">
        <p className="text-large">General Settings</p>
        <p className="text-small text-default-500">Manage your data</p>
      </CardHeader>
      <div className="grid grid-col-1 gap-y-3 px-3">
        {!subscription && (
          <Accordion variant="bordered">
            <AccordionItem
              className="p-0"
              key="1"
              aria-label="Subscriptions"
              startContent={
                <Icon icon="solar:medal-ribbon-star-linear" width={32} />
              }
              subtitle={
                <div className="flex items-center">
                  Subscribe now to get access to all premium features. Cancel
                  anytime.
                </div>
              }
              title="Subscriptions"
            >
              <div className="grid grid-col-1 gap-y-2">
                {STRIPE_PLANS.map((plan) => (
                  <div
                    key={plan.priceId}
                    className="flex items-center justify-between"
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
        )}
        {subscription && (
          <CardBody className="p-0">
            <div className="flex items-start md:items-center flex-col md:flex-row gap-y-2 md:gap-y-0 justify-between bg-none rounded-medium p-4 border-medium border-divider">
              <div className="flex items-center gap-x-2">
                <Icon icon="solar:medal-ribbon-star-linear" width={32} />
                <div>
                  Current Plan:
                  <div className="text-small text-default-500 flex gap-x-1 flex-col md:flex-row">
                    <div className="text-success">
                      ${subscription.price}
                      {subscription.duration}
                    </div>
                    <div>
                      <div
                        className={
                          user.subscription?.cancelAt ? "text-danger" : ""
                        }
                      >
                        {user.subscription?.cancelAt
                          ? "will be canceled on"
                          : "will be renewed on"}{" "}
                        {format(
                          new Date(
                            user.subscription?.cancelAt ||
                              user.subscription?.expires ||
                              ""
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
        )}
        <CardBody className="p-0">
          <div className="flex items-center justify-between bg-content2 rounded-medium p-4">
            <div>
              Bank Account
              <div className="text-small text-default-500">
                No bank account connected
              </div>
            </div>
            <div>
              <Button color="primary">Connect</Button>
            </div>
          </div>
        </CardBody>
      </div>
    </>
  );
}
