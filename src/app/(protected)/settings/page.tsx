"use client";

import React from "react";
import { Tab, Tabs } from "@nextui-org/tabs";

export default function SettingsPage() {
  return (
    <div className="relative z-10 flex flex-col w-full p-8">
      <div className="flex items-center gap-x-3">
        <h1 className="text-5xl font-bold leading-9 text-default-foreground">
          Settings
        </h1>
      </div>
      <h2 className="mt-4 text-small text-default-500">
        Customize settings, email preferences, and web appearance.
      </h2>
      <div className="max-w-2xl">
        <Tabs
          fullWidth
          classNames={{
            base: "mt-6",
            cursor: "bg-content1 dark:bg-content1",
            panel: "w-full p-0 pt-4",
          }}
        >
          <Tab key="profile" title="Profile">
            {/* <ProfileSetting /> */}
            <div>Profile</div>
          </Tab>
          <Tab key="appearance" title="Appearance">
            {/* <AppearanceSetting /> */}
          </Tab>
          <Tab key="account" title="Account">
            {/* <AccountSetting /> */}
          </Tab>
          <Tab key="billing" title="Billing">
            {/* <BillingSetting /> */}
          </Tab>
          <Tab key="team" title="Team">
            {/* <TeamSetting /> */}
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
