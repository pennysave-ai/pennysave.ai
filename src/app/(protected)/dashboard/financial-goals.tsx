import { Card } from "@heroui/card";

export default function FinancialGoals() {
  return (
    <Card
      as="dl"
      className="md:col-span-1 border border-transparent dark:border-default-100 p-4"
    >
      <div className="text-sm font-medium text-default-600">
        Financial Goals
      </div>
    </Card>
  );
}
