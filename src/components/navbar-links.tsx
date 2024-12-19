"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  Navbar,
  NavbarContent,
  NavbarMenuToggle,
  NavbarMenu,
} from "@nextui-org/navbar";
import NavbarLink from "@/components/navbar-link";

interface NavbarProps {
  children: React.ReactNode;
  navItems: {
    name: string;
    href: string;
    protectedPath: boolean;
  }[];
}

export default function NavbarLinks({ children, navItems }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [pathname]);
  return (
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
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {navItems.map(({ name, href }, i) => (
          <NavbarLink
            key={`${name}-${i}`}
            href={href}
            name={name}
            isActive={pathname === href}
          />
        ))}
      </NavbarContent>
      <NavbarMenu>
        {navItems.map(({ name, href }, i) => (
          <NavbarLink
            key={`${name}-${i}`}
            href={href}
            name={name}
            isActive={pathname === href}
          />
        ))}
      </NavbarMenu>
      {children}
    </Navbar>
  );
}
