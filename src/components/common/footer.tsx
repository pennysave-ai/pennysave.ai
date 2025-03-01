"use client";
import { Link } from "@heroui/link";
import { useRouter } from "next/navigation";

export function Footer() {
  const router = useRouter();
  return (
    <>
      <div className="flex flex-col md:flex-row gap-x-4">
        <Link
          className="text-sm cursor-pointer"
          onPress={() => {
            router.push("/privacy-policy");
          }}
        >
          Privacy policy
        </Link>
        <Link className="text-sm" href="mailto:support@pennysave.ai">
          support@pennysave.ai
        </Link>
      </div>
      <div className="text-sm text-default-400">pennysave.ai © 2025 </div>
    </>
  );
}
