"use client";

import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";

export default function HeroButtons() {
  const router = useRouter();

  const handleSignUp = () => {
    router.push("/auth/sign-up");
  };

  const handleSignIn = () => {
    router.push("/auth/sign-in");
  };

  return (
    <>
      <Button
        color="primary"
        variant="flat"
        size="lg"
        className="rounded-full"
        onPress={handleSignUp}
      >
        Register Now
      </Button>
      <Button
        color="primary"
        variant="solid"
        size="lg"
        className="rounded-full"
        onPress={handleSignIn}
      >
        Sign in
      </Button>
    </>
  );
}
