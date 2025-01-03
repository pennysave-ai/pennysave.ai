import { NavbarContent, NavbarItem } from "@nextui-org/navbar";

import ThemeSwitcher from "@/components/theme-switcher";
import type { Session } from "next-auth";
import NavbarCustomMenu from "@/components/navbar-custom-menu";

interface HeaderProps {
  navItems?: {
    name: string;
    href: string;
  }[];
  user?: Session["user"] | null;
}

export async function Header({ user, navItems }: HeaderProps) {
  return (
    <NavbarCustomMenu user={user || null} navItems={navItems}>
      <NavbarContent justify="end">
        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>
      </NavbarContent>
    </NavbarCustomMenu>
  );
}
