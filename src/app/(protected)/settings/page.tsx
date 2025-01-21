import React from "react";

import { Card } from "@heroui/card";
import { Hero } from "@/components/common";
import Tabs from "./tabs";
import { auth } from "@/auth";

export default async function Settings() {
  const session = await auth();
  if (!session) return null;
  return (
    <div className="relative z-10 flex flex-col w-full">
      <Hero description="Customize settings, email preferences, and web appearance." />
      <div className="flex w-full max-w-screen-2xl -mt-20 px-4 mx-auto">
        <Card className="p-8 w-full">
          <Tabs user={session?.user} />
        </Card>
      </div>
    </div>
  );
}
