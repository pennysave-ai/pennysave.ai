"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Loader } from "@/app/icons";
import { useCreateCheckoutSession } from "@/features/stripe/hooks";

interface SubscriptionButtonProps {
  priceId: string;
}

export default function SubscriptionButton({
  priceId,
}: SubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const createCheckoutSession = useCreateCheckoutSession();
  const handleCheckout = async () => {
    try {
      setLoading(true);
      const session = await createCheckoutSession.mutateAsync(priceId);
      setLoading(false);
      if (session.url) {
        window.location.href = session.url;
      } else {
        console.error("Failed to create checkout session");
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };
  return (
    <Button
      isDisabled={loading}
      color="primary"
      onPress={handleCheckout}
      className="items-center justify-center"
    >
      {loading ? (
        <div className="w-[28px]">
          <Loader />
        </div>
      ) : (
        "Subscribe"
      )}
    </Button>
  );
}
