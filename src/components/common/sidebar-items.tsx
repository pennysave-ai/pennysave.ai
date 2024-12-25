"use client";

import type { Session } from "next-auth";
import { Tooltip } from "@nextui-org/tooltip";
import { Spacer } from "@nextui-org/spacer";
import UserMenu from "@/components/user-menu";
import { cn } from "@nextui-org/theme";
import { Icon } from "@iconify/react";
import { Button } from "@nextui-org/button";
import { ScrollShadow } from "@nextui-org/scroll-shadow";
import SidebarMainMenuItems from "@/components/sidebar-main-menu-items";
import { sectionItems } from "@/components/sidebar-items";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

interface SidebarItemsProps {
  user: Session["user"] | null;
  isCompact?: boolean;
}

export function SidebarItems({ user, isCompact = false }: SidebarItemsProps) {
  let pathname = usePathname();
  pathname = pathname.replace("/", "");
  const router = useRouter();
  return (
    <>
      {user && (
        <UserMenu user={user} isCompact={isCompact} pathName={pathname} />
      )}
      <ScrollShadow className="-mr-6 h-full max-h-full py-6 pr-6">
        <SidebarMainMenuItems
          defaultSelectedKey="dashboard"
          isCompact={isCompact}
          selectedKeys={[pathname]}
          items={sectionItems}
          onSelect={(key) => {
            if (!key) return;
            router.push(`/${key}`);
          }}
        />
      </ScrollShadow>
      <Spacer y={2} />
      <div
        className={cn("mt-auto flex flex-col", {
          "items-center": isCompact,
        })}
      >
        <Tooltip
          content="Help & Feedback"
          isDisabled={!isCompact}
          placement="right"
        >
          <Button
            fullWidth
            className={cn(
              "justify-start truncate text-default-500 data-[hover=true]:text-foreground",
              {
                "justify-center": isCompact,
              }
            )}
            isIconOnly={isCompact}
            startContent={
              isCompact ? null : (
                <Icon
                  className="flex-none text-default-500"
                  icon="solar:info-circle-line-duotone"
                  width={24}
                />
              )
            }
            variant="light"
          >
            {isCompact ? (
              <Icon
                className="text-default-500"
                icon="solar:info-circle-line-duotone"
                width={24}
              />
            ) : (
              "Help & Information"
            )}
          </Button>
        </Tooltip>
        <Tooltip content="Log Out" isDisabled={!isCompact} placement="right">
          <Button
            onPress={() => signOut()}
            className={cn(
              "justify-start text-foreground-500 data-[hover=true]:text-danger",
              {
                "justify-center": isCompact,
              }
            )}
            isIconOnly={isCompact}
            startContent={
              isCompact ? null : (
                <Icon
                  className="text-danger"
                  icon="solar:logout-2-bold-duotone"
                  width={24}
                />
              )
            }
            color="danger"
            variant="flat"
          >
            {isCompact ? (
              <Icon
                className="text-danger"
                icon="solar:logout-2-bold-duotone"
                width={24}
              />
            ) : (
              "Log Out"
            )}
          </Button>
        </Tooltip>
      </div>
    </>
  );
}
