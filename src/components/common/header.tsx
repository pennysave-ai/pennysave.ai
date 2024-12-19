import { NavbarContent, NavbarItem } from "@nextui-org/navbar";

import ThemeSwitcher from "@/components/theme-switcher";
import type { Session } from "next-auth";
import NavbarLinks from "@/components/navbar-links";
import UserMenu from "../user-menu";

interface HeaderProps {
  navItems: {
    name: string;
    href: string;
    protectedPath: boolean;
  }[];
  user?: Session["user"] | null;
}

export async function Header({ navItems, user }: HeaderProps) {
  return (
    <NavbarLinks navItems={navItems}>
      <NavbarContent justify="end">
        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>
        {!!user && <UserMenu user={user} />}
      </NavbarContent>
    </NavbarLinks>
  );
}
