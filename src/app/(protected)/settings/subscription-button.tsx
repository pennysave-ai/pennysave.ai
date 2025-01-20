"use client";

import { useState } from "react";
import { Button } from "@nextui-org/button";

interface SubscriptionButtonProps {
  priceId: string;
  highlight?: boolean;
}

export default function SubscriptionButton({
  priceId,
  highlight,
}: SubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const handleCheckout = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });
      const session = await response.json();
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
    <Button
      isLoading={loading}
      color="primary"
      onPress={handleCheckout}
      className={highlight ? "shine-button" : ""}
    >
      Subscribe
    </Button>
  );
}
