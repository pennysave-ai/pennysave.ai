import { Chip } from "@nextui-org/chip";
import { Icon } from "@iconify/react";

import { type SidebarItem } from "./sidebar-main-menu-items";

export const sectionItems: SidebarItem[] = [
  {
    key: "overview",
    title: "Menu",
    items: [
      {
        key: "dashboard",
        // href: "/dashboard",
        icon: "solar:pie-chart-2-outline",
        title: "Dashboard",
      },
      {
        key: "accounts",
        // href: "/accounts",
        icon: "solar:wallet-money-outline",
        title: "Accounts",
        endContent: (
          <Icon
            className="text-default-400"
            icon="solar:add-circle-line-duotone"
            width={24}
          />
        ),
      },
      {
        key: "tasks",
        href: "#",
        icon: "solar:checklist-minimalistic-outline",
        title: "-",
        endContent: (
          <Icon
            className="text-default-400"
            icon="solar:add-circle-line-duotone"
            width={24}
          />
        ),
      },
      {
        key: "team",
        href: "#",
        icon: "solar:users-group-two-rounded-outline",
        title: "-",
      },
      {
        key: "tracker",
        href: "#",
        icon: "solar:sort-by-time-linear",
        title: "-",
        endContent: (
          <Chip size="sm" variant="flat">
            New
          </Chip>
        ),
      },
    ],
  },
];
