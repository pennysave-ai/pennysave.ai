import { Chip } from "@nextui-org/chip";

import { type SidebarItem } from "./sidebar-main-menu-items";

export const sectionItems: SidebarItem[] = [
  {
    key: "overview",
    title: "Menu",
    items: [
      {
        key: "dashboard",
        icon: "solar:pie-chart-2-outline",
        title: "Dashboard",
      },
      {
        key: "accounts",
        icon: "solar:wallet-money-outline",
        title: "Accounts",
      },
      {
        key: "categories",
        icon: "solar:checklist-minimalistic-outline",
        title: "Categories",
      },
      {
        key: "transactions",
        icon: "solar:card-transfer-linear",
        title: "Transactions",
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
