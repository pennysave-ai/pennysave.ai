"use client";

import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import { Image } from "@heroui/image";
import appleBadge from "@/app/public/apple_badge.svg";

export default function HeroButtons() {
  const router = useRouter();

  const handleSignUp = () => {
    router.push("/auth/sign-up");
  };

  return (
    <div className="flex gap-4 items-center flex-col md:flex-row">
      <Button
        color="primary"
        variant="solid"
        size="lg"
        className="rounded-full"
        onPress={handleSignUp}
      >
        Discover Web Version
      </Button>
      <div className="text-lg text-default-500 ">or</div>
      <a
        href="https://apps.apple.com/app/id6754218614"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          src={appleBadge.src}
          alt="Download on the App Store"
          width={135}
          height={40}
          loading="eager"
          fetchPriority="high"
        />
      </a>
    </div>
  );
}
