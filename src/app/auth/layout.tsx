"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Logo, Footer } from "@/components/common";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/navbar";
import ThemeSwitcher from "@/components/theme-switcher";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";

export default function UnprotectedRoadsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const menuItems = [
    {
      name: "Home",
      href: "/",
    },
    {
      name: "Sign Up",
      href: "/auth/sign-up",
    },
    {
      name: "Reset Password",
      href: "/auth/reset-password",
    },
  ];
  return (
    <div className="flex flex-col h-screen">
      <Navbar
        classNames={{
          base: "mt-0 md:mt-10 bg-transparent backdrop-saturate-0",
          wrapper:
            "w-full justify-between bg-background md:bg-transparent max-w-6xl mx-auto",
          item: "hidden md:flex",
        }}
        style={{
          backdropFilter: "none",
        }}
        height="60px"
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
      >
        <NavbarMenuToggle className="text-default-400 md:hidden" />

        <NavbarBrand className="hidden md:flex">
          <div className="backdrop-blur-md backdrop-saturate-150 py-[11px] px-4 rounded-full">
            <Logo />
          </div>
        </NavbarBrand>
        <div className="flex items-center">
          <NavbarContent
            className="hidden gap-x-6 rounded-full border-small border-default-200/20 bg-background/60 px-4 py-1 shadow-medium backdrop-blur-md backdrop-saturate-150 dark:bg-default-100/50 md:flex"
            justify="center"
          >
            <NavbarItem>
              <Link
                className="text-default-500 cursor-pointer"
                size="sm"
                onPress={() => {
                  router.push("/");
                }}
              >
                Home
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link
                className="text-default-500 cursor-pointer"
                size="sm"
                onPress={() => {
                  router.push("/auth/reset-password");
                }}
              >
                Reset password
              </Link>
            </NavbarItem>
            {path === "/auth/sign-in" && (
              <Button
                as={Button}
                href=""
                color="primary"
                radius="full"
                variant="solid"
                onPress={() => {
                  router.push("/auth/sign-up");
                }}
              >
                Sign up
              </Button>
            )}
            {(path === "/auth/sign-up" ||
              path === "/auth/reset-password" ||
              path === "/auth/verify-email" ||
              path === "/auth/new-password") && (
              <Button
                as={Button}
                href=""
                color="primary"
                radius="full"
                variant="solid"
                onPress={() => {
                  router.push("/auth/sign-in");
                }}
              >
                Sign in
              </Button>
            )}
          </NavbarContent>
          <NavbarContent justify="end">
            <NavbarItem className="ml-2 !flex gap-2">
              <ThemeSwitcher />
            </NavbarItem>
          </NavbarContent>
        </div>
        <NavbarMenu
          className="top-[calc(var(--navbar-height)_-_1px)] max-h-[100vh] bg-default-200/50 pt-6 shadow-medium backdrop-blur-md backdrop-saturate-150 dark:bg-default-100/50"
          motionProps={{
            initial: { opacity: 0, y: -20 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -20 },
            transition: {
              ease: "easeInOut",
              duration: 0.2,
            },
          }}
        >
          {menuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                className="w-full text-default-500 cursor-pointer"
                href={item.href}
                size="md"
              >
                {item.name}
              </Link>
            </NavbarMenuItem>
          ))}
        </NavbarMenu>
      </Navbar>
      <main className="flex-grow flex">{children}</main>
      <footer className="flex flex-col md:flex-row justify-between px-6 py-2 max-w-6xl mx-auto w-full">
        <Footer />
      </footer>
    </div>
  );
}
