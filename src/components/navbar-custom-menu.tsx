"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Divider } from "@heroui/divider";

import { Navbar, NavbarContent, NavbarMenuToggle } from "@heroui/navbar";
import { Modal, ModalContent, ModalBody } from "@heroui/modal";
import { Session } from "next-auth";
import { SidebarItems } from "@/components/common";

interface NavbarProps {
  children: React.ReactNode;
  user: Session["user"] | null;
}

const sidebarWidth = 288;

export default function NavbarCustomMenu({ children, user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme } = useTheme();
  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Navbar
        isBlurred
        isBordered
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
      >
        <NavbarContent className="sm:hidden" justify="start">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          />
        </NavbarContent>
        {children}
      </Navbar>
      <Modal
        classNames={{
          base: "justify-start m-0 p-0 h-dvh max-h-full w-[var(--sidebar-width)]",
          wrapper: "items-start justify-start !w-[var(--sidebar-width)]",
          body: "p-0",
          closeButton: "z-50",
        }}
        isOpen={isMenuOpen}
        motionProps={{
          variants: {
            enter: {
              x: 0,
              transition: {
                duration: 0.3,
                ease: "easeOut",
              },
            },
            exit: {
              x: -288,
              transition: {
                duration: 0.2,
                ease: "easeOut",
              },
            },
          },
        }}
        radius="none"
        scrollBehavior="inside"
        style={{
          // @ts-expect-error "--sidebar-width"' does not exist in type 'Properties<string | number, string & {}>'
          "--sidebar-width": `${sidebarWidth}px`,
        }}
        onOpenChange={setIsMenuOpen}
      >
        <ModalContent>
          <ModalBody>
            <div
              className="py-10 px-6 flex flex-col flex-1"
              style={{
                backgroundColor:
                  theme === "dark"
                    ? "var(--background)"
                    : "var(--heroui-content1)",
              }}
            >
              <span className="text-small font-bold opacity-100 mb-3">
                <span className="py-1 px-2 text-lg bg-secondary rounded-md mr-1 text-white">
                  P
                </span>
                ENNYSAVE.
                <span className="text-primary">AI</span>
              </span>
              <Divider className="mb-4" />
              <SidebarItems user={user} />
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
