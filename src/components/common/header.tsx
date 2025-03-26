import { NavbarContent, NavbarItem } from "@heroui/navbar";

import ThemeSwitcher from "@/components/theme-switcher";
import type { Session } from "next-auth";
import NavbarCustomMenu from "@/components/navbar-custom-menu";

interface HeaderProps {
  user?: Session["user"] | null;
}

export async function Header({ user }: HeaderProps) {
  return (
    <NavbarCustomMenu user={user || null}>
      <NavbarContent justify="end">
        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>
      </NavbarContent>
    </NavbarCustomMenu>
  );
}
