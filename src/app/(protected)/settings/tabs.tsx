"use client";

import { Tab, Tabs } from "@nextui-org/tabs";
import { Icon } from "@iconify/react";
import { Session } from "next-auth";

import General from "./general";
import Notifications from "./notifications";

interface SettingTabsProps {
  user: Session["user"];
}

export default function SettingTabs({ user }: SettingTabsProps) {
  return (
    <>
      <Tabs
        classNames={{
          base: "",
          cursor: "bg-content1 dark:bg-content1",
          panel: "p-0 pt-4",
        }}
      >
        <Tab
          key="general"
          title={
            <div className="flex items-center gap-1.5">
              <Icon icon="solar:user-id-bold" width={20} />
              <p>General</p>
            </div>
          }
        >
          <General user={user} />
        </Tab>
        <Tab
          key="profile"
          title={
            <div className="flex items-center gap-1.5">
              <Icon icon="solar:bell-bold" width={20} />
              <p>Notifications</p>
            </div>
          }
        >
          <Notifications />
        </Tab>
      </Tabs>
    </>
  );
}
