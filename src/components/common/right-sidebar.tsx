"use client";
import { Drawer, DrawerContent } from "@heroui/drawer";

interface RightSidebarProps {
  isOpen: boolean;
  onOpenChange: () => void;
  children?: React.ReactNode;
}

export function RightSidebar({
  isOpen,
  onOpenChange,
  children,
}: RightSidebarProps) {
  return (
    <>
      <Drawer
        className="p-4 rounded-none"
        backdrop="opaque"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <DrawerContent>{() => <>{children}</>}</DrawerContent>
      </Drawer>
    </>
  );
}
