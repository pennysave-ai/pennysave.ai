"use client";

import React from "react";
import { Tab, Tabs } from "@nextui-org/tabs";
import { Card } from "@nextui-org/card";
import { Icon } from "@iconify/react";
import { Hero } from "@/components/common";
import General from "./general";
import Notifications from "./notifications";

export default function Settings() {
  return (
    <div className="relative z-10 flex flex-col w-full">
      <Hero description="Customize settings, email preferences, and web appearance." />
      <div className="flex w-full max-w-screen-2xl -mt-20 px-4 mx-auto">
        <Card className="p-8 w-full">
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
              <General />
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
        </Card>
      </div>
    </div>
  );
}
