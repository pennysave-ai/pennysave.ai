"use client";

import { useMemo } from "react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { Tooltip } from "@nextui-org/tooltip";
import { Spacer } from "@nextui-org/spacer";
import { Card, CardBody, CardFooter } from "@nextui-org/card";
import UserMenu from "@/components/user-menu";
import { cn } from "@nextui-org/theme";
import { Icon } from "@iconify/react";
import { Button } from "@nextui-org/button";
import { ScrollShadow } from "@nextui-org/scroll-shadow";
import SidebarMainMenuItems, {
  SidebarItem,
} from "@/components/sidebar-main-menu-items";
import { sectionItems } from "@/components/sidebar-items";
import { usePathname, useRouter } from "next/navigation";
import { useGetEntities } from "@/features/entities/hooks";
import { Chip } from "@nextui-org/chip";

interface SidebarItemsProps {
  user: Session["user"] | null;
  isCompact?: boolean;
}

export function SidebarItems({ user, isCompact = false }: SidebarItemsProps) {
  let pathname = usePathname();
  const { data } = useGetEntities();
  pathname = pathname.replace("/", "");
  const router = useRouter();

  const items = useMemo(() => {
    return sectionItems.reduce((acc, section) => {
      if (section.items) {
        const items = section.items.map((item) => {
          if (["categories", "transactions", "accounts"].includes(item.key)) {
            item.endContent = (
              <Chip size="sm" variant="flat">
                {data?.[item.key] > 999 ? "999+" : data?.[item.key]}
              </Chip>
            );
          }
          return item;
        });
        acc.push({ ...section, items });
      } else {
        acc.push(section);
      }
      return acc;
    }, [] as SidebarItem[]);
  }, [data]);

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
          items={items}
          onSelect={(key) => {
            if (!key) return;
            router.push(`/${key}`);
          }}
        />
        {!isCompact && (
          <Card className="mx-2 overflow-visible mb-2" shadow="sm">
            <CardBody className="items-center py-5 text-center">
              <div className="flex justify-start gap-x-2 items-center">
                <Icon icon="solar:medal-ribbon-star-linear" width={32} />
                <h3 className="text-medium font-medium text-default-700 text-start">
                  Subscribe to the Pro Plan
                </h3>
              </div>
              <p className="p-4 text-small text-default-500 text-start">
                Get access to all premium features only for $4.99/month.
              </p>
            </CardBody>
            <CardFooter className="absolute -bottom-8 justify-center">
              <Button
                className="px-10 shadow-md"
                color="primary"
                variant="shadow"
                onPress={() => router.push("/settings?cta=subscribe")}
              >
                Subscribe
              </Button>
            </CardFooter>
          </Card>
        )}
      </ScrollShadow>
      <Spacer y={2} />
      <div
        className={cn("mt-auto flex flex-col", {
          "items-center": isCompact,
        })}
      >
        {/* <Tooltip
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
        </Tooltip> */}
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
