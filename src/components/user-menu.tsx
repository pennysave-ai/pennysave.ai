"use client";

import { Avatar } from "@heroui/avatar";
import type { Session } from "next-auth";
import { cn } from "@heroui/theme";
import { Tooltip } from "@heroui/tooltip";
import { useRouter } from "next/navigation";

function getOptimizedImageUrl(url?: string | null) {
  if (!url) return null;
  if (url.includes("githubusercontent") || url.includes("gravatar.com")) {
    return `${url}&s=50`;
  }
  return url;
}

interface UserMenuProps {
  user: Session["user"];
  isCompact: boolean;
  pathName: string;
}

export default function UserMenu({ user, isCompact, pathName }: UserMenuProps) {
  const router = useRouter();
  return (
    <Tooltip content="User settings" isDisabled={!isCompact} placement="right">
      <button
        className={cn(
          "z-0 flex items-center gap-3 px-3 py-1.5 hover:bg-default-100 rounded-[14px] overflow-hidden",
          {
            "bg-default-100": pathName === "settings",
          }
        )}
        onClick={() => {
          router.push("/settings");
        }}
      >
        <Avatar
          isBordered
          className="flex-none"
          size="sm"
          src={getOptimizedImageUrl(user.image) || ""}
        />
        <div
          className={cn("flex max-w-full flex-col items-start", {
            hidden: isCompact,
          })}
        >
          <p className="truncate text-small font-medium text-default-600">
            {user.name}
          </p>
          <p className="truncate text-tiny text-default-400">{user.email}</p>
        </div>
      </button>
    </Tooltip>
  );
}
