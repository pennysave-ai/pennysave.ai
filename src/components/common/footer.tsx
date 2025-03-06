"use client";
import { Link } from "@heroui/link";
import { useRouter } from "next/navigation";

export function Footer() {
  const router = useRouter();
  return (
    <>
      <div className="flex flex-col md:flex-row gap-y-1 md:gap-x-4 mb-1 md:mb-0">
        <Link
          className="text-sm cursor-pointer dark:text-primary-600"
          onPress={() => {
            router.push("/privacy-policy");
          }}
        >
          Privacy policy
        </Link>
        <Link
          className="text-sm dark:text-primary-600"
          href="mailto:support@pennysave.ai"
        >
          support@pennysave.ai
        </Link>
      </div>
      <div className="text-sm text-default-500">pennysave.ai © 2025 </div>
    </>
  );
}
