"use client";

import { useState, useEffect } from "react";
import { Session } from "next-auth";
import { CardBody, CardHeader } from "@heroui/card";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import SwitchCell from "./switch-cell";
import { useModal } from "@/app/providers/modal";
import { useUpdateNotifiactionPreferences } from "@/features/users/hooks";

interface NotificationsProps {
  user: Session["user"];
}

export default function Notifications({ user }: NotificationsProps) {
  const defaultState = {
    monthlyReports: false,
  };
  useEffect(() => {
    if (user?.notifications) {
      setState({
        monthlyReports: user.notifications.monthlyReports,
      });
    }
  }, [user]);
  const [state, setState] = useState(defaultState);
  const { onOpen: onPaywallModalOpen } = useModal();
  const [updating, setUpdating] = useState(false);
  const { mutateAsync: udpateUserPreferences } =
    useUpdateNotifiactionPreferences();
  const handleResest = () => {
    setState(defaultState);
  };
  const handleNotificationsSave = async () => {
    setUpdating(true);
    try {
      await udpateUserPreferences({
        monthlyReports: state.monthlyReports,
      });
    } catch {
      console.error("Failed to save user notifications changes");
    }
    setUpdating(false);
    addToast({
      title: "Success",
      description: "You have successfully updated your notification settings",
      color: "success",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.hasActiveStripeSubscription) {
      onPaywallModalOpen();
    } else {
      setState({ ...state, monthlyReports: e.target.checked });
    }
  };
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
            icon={<Icon icon="solar:document-text-outline" width={32} />}
            classNames={{
              label: "ms-0",
              base: "py-[18px]",
            }}
            description="Enable monthly email reports on your income and expenses."
            label="Monthly Reports"
            isSelected={state.monthlyReports}
            onChange={handleChange}
          />
          {/* <SwitchCell
            description="Allow AI advisor to send you reports on your spending habits, and advice on how to save more."
            label="AI Reports"
          /> */}
          <div className="flex w-full justify-end gap-2 pt-4">
            <Button variant="bordered" onPress={handleResest}>
              Reset to Default
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={updating}
              onPress={handleNotificationsSave}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </CardBody>
    </>
  );
}
