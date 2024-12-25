import { NavbarContent, NavbarItem } from "@nextui-org/navbar";

import ThemeSwitcher from "@/components/theme-switcher";
import type { Session } from "next-auth";
import NavbarMenu from "@/components/navbar-menu";

interface HeaderProps {
  navItems?: {
    name: string;
    href: string;
    protectedPath: boolean;
  }[];
  user?: Session["user"] | null;
}

export async function Header({ user }: HeaderProps) {
  return (
    <NavbarMenu user={user || null}>
      <NavbarContent justify="end">
        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>
      </NavbarContent>
    </NavbarMenu>
  );
}
