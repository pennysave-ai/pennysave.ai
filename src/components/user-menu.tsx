"use client";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/dropdown";
import { Avatar } from "@nextui-org/avatar";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

function getOptimizedImageUrl(url?: string | null) {
  if (!url) return null;
  if (url.includes("githubusercontent") || url.includes("gravatar.com")) {
    return `${url}&s=50`;
  }
  return url;
}

interface UserMenuProps {
  user: Session["user"];
}

export default function UserMenu({ user }: UserMenuProps) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Avatar
          isBordered
          as="button"
          src={getOptimizedImageUrl(user.image) || ""}
        />
      </DropdownTrigger>
      <DropdownMenu aria-label="Static Actions" disabledKeys={["profile"]}>
        <DropdownItem
          key="profile"
          isReadOnly
          className="h-14 gap-2 opacity-100"
          textValue="Profile"
        >
          <div>{user.name}</div>
          <div className="text-xs">{user.email}</div>
        </DropdownItem>
        <DropdownItem
          key="sign-out"
          className="text-danger"
          color="danger"
          onPress={() => signOut()}
        >
          Sign Out
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
