"use client";

import { CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import SwitchCell from "./switch-cell";

export default function Notifications() {
  return (
    <>
      <CardHeader className="flex flex-col items-start px-4 pb-0 pt-4">
        <p className="text-large">Notification Settings</p>
        <p className="text-small text-default-500">
          Manage your notification preferences
        </p>
      </CardHeader>
      <CardBody>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => e.preventDefault()}
        >
          <SwitchCell
            description="Enable email alert notifications"
            label="Email Alerts"
          />
          {/* <SwitchCell
            description="Allow AI advisor to send you reports on your spending habits, and advice on how to save more."
            label="AI Reports"
          /> */}
          <div className="flex w-full justify-end gap-2 pt-4">
            <Button variant="bordered">Reset to Default</Button>
            <Button color="primary" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </CardBody>
    </>
  );
}
