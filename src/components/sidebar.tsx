"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { Spacer } from "@heroui/spacer";
import { cn } from "@heroui/theme";
import { useMediaQuery } from "usehooks-ts";
import type { Session } from "next-auth";
import { SidebarItems } from "@/components/common";

interface SidebarProps {
  user: Session["user"] | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isCompact = isCollapsed || isMobile;
  const [isRendered, setIsRendered] = useState(false);
  useEffect(() => {
    setIsRendered(true);
    const isCollapsed = localStorage.getItem("sidebarCollapsed");
    setIsCollapsed(isCollapsed === "true");
  }, []);

  const onToggle = useCallback(() => {
    setIsCollapsed((prev) => {
      localStorage.setItem("sidebarCollapsed", String(!prev));
      return !prev;
    });
  }, []);
  if (!isRendered || isMobile) return null;
  return (
    <div
      className={cn(
        "relative flex h-full w-[340px] flex-col !border-r-small border-divider p-6 transition-width items-center",
        {
          "w-16 items-center px-2 py-6": isCompact,
        }
      )}
    >
      <div className="sticky top-24">
        <div className="flex flex-col w-full">
          <div
            className={cn(
              "flex items-center gap-3 px-3 justify-between",

              {
                "justify-center gap-0": isCompact,
              }
            )}
          >
            <span
              className={cn("text-small font-bold opacity-100", {
                "w-0 opacity-0": isCompact,
              })}
            >
              <span className="py-1 px-2 text-lg bg-secondary rounded-md mr-1 text-white">
                P
              </span>
              ENNYSAVE.
              <span className="text-primary">AI</span>
            </span>
            <div className="flex h-8 w-8 items-center justify-center">
              <Button isIconOnly variant="light" onPress={onToggle}>
                <span
                  className={`transform transition-transform duration-500 ${
                    isCompact ? "" : "rotate-180"
                  }`}
                >
                  <Icon
                    className="text-default-500"
                    height={24}
                    icon="solar:round-alt-arrow-right-linear"
                    width={24}
                  />
                </span>
              </Button>
            </div>
          </div>
          <Spacer y={8} />
          <SidebarItems user={user} isCompact={isCompact} />
        </div>
      </div>
    </div>
  );
}
