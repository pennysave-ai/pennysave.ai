"use client";

import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";

export default function HeroButtons() {
  const router = useRouter();

  const handleSignUp = () => {
    router.push("/auth/sign-up");
  };

  return (
    <Button
      color="primary"
      variant="solid"
      size="lg"
      className="rounded-full"
      onPress={handleSignUp}
    >
      Get Started For Free
    </Button>
  );
}
