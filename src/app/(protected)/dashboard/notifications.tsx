import { Card } from "@heroui/card";

export default function Notifications() {
  return (
    <Card
      as="dl"
      className="border border-transparent dark:border-default-100 lg:col-span-2 md:col-span-1 p-4"
    >
      <div className="text-sm font-medium text-default-600">Notifications</div>
    </Card>
  );
}
