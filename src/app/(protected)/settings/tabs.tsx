"use client";

import { Tab, Tabs } from "@heroui/tabs";
import { Icon } from "@iconify/react";

interface SettingTabsProps {
  children: React.ReactNode[];
}

export default function SettingTabs({ children }: SettingTabsProps) {
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
          {children[0]}
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
          {children[1]}
        </Tab>
      </Tabs>
    </>
  );
}
