"use server";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import DataCard from "@/app/(protected)/dashboard/data-card";

const PREV_PERIOD = {
  start: "",
  end: "",
};

const EXPENSES = [
  { day: "2025-01-28T23:00:00.000Z", value: 5 },
  {
    day: "2025-01-29T23:00:00.000Z",
    value: 4,
  },
  {
    day: "2025-01-30T23:00:00.000Z",
    value: 2,
  },
  {
    day: "2025-01-30T23:00:00.000Z",
    value: 3,
  },
];

const INCOME = [
  { day: "2025-01-28T23:00:00.000Z", value: 3 },
  {
    day: "2025-01-29T23:00:00.000Z",
    value: 5,
  },
  {
    day: "2025-01-30T23:00:00.000Z",
    value: 8,
  },
];

export default async function Features() {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthFormatted = format(lastMonth, "MMMM yyyy");
  return (
    <section id="features" className="flex relative mt-10 flex-col gap-3 px-6">
      <h2 className="text-4xl font-bold text-center mb-10">
        The{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
          features
        </span>{" "}
        you will get with us.
      </h2>
      <div className="flex gap-3 flex-col md:flex-row">
        <div className="flex basis-1/2">
          <Card
            isBlurred
            fullWidth
            className="p-0 border-none bg-background/60 dark:bg-default-100/50"
            shadow="sm"
          >
            <CardBody className="p-0 relative">
              <div className="px-6 pt-6 flex items-center gap-x-2">
                <Icon
                  icon="solar:graph-new-up-bold"
                  className="text-primary dark:text-white"
                  width={34}
                />
                Simple Analytics
              </div>
              <div className="p-3 mb-[70px] md:mb-12 flex flex-col gap-y-5">
                <DataCard
                  displayOnly
                  title="Income"
                  type="income"
                  value={5622}
                  prefix="$"
                  change={21}
                  data={INCOME}
                  prevPeriod={PREV_PERIOD}
                />
                <DataCard
                  displayOnly
                  title="Expenses"
                  type="expenses"
                  value={3200}
                  prefix="$"
                  change={2}
                  data={EXPENSES}
                  prevPeriod={PREV_PERIOD}
                />
              </div>
              <p className="text-default-500 absolute bottom-0 backdrop-blur-md backdrop-saturate-150 py-3 px-6 w-full">
                Use different charts and graphs to visualize your finances.
              </p>
            </CardBody>
          </Card>
        </div>
        <div className="flex basis-1/2">
          <Card
            isBlurred
            fullWidth
            className="p-0 border-none bg-background/60 dark:bg-default-100/50"
            shadow="sm"
          >
            <CardBody className="p-0 relative">
              <div className="flex gap-x-2 items-center px-6 pt-6">
                <Icon
                  icon="solar:star-fall-bold"
                  className="text-primary dark:text-white"
                  width={34}
                />
                Personal financial AI advisor
              </div>
              <div className="p-3 mb-[120px] md:mb-0 flex flex-col gap-y-3 items-center">
                <Card className="p-3 w-full justify-center">
                  Identify my unnecessary expenses
                </Card>
                <Card className="p-3 w-[96%] justify-center opacity-80">
                  Create an income report for the last month
                </Card>
                <Card className="p-3 w-[94%] justify-center opacity-60">
                  How much money did I spend on food last week?
                </Card>
                <Card className="p-3 w-[92%] justify-center opacity-60">
                  How can I optimize my expences?
                </Card>
              </div>
              <p className="text-default-500 absolute bottom-0 backdrop-blur-md backdrop-saturate-150 py-3 px-6 w-full">
                Get personalized insights and recommendations to help you save
                money, reduce debt, and improve your financial health.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
      <div className="w-full flex gap-3 flex-col md:flex-row">
        <Card
          isBlurred
          fullWidth
          className="p-0 border-none bg-background/60 dark:bg-default-100/50"
          shadow="sm"
        >
          <CardBody className="p-0 relative">
            <div className="flex gap-x-2 items-center px-6 pt-6">
              <Icon
                icon="solar:bill-check-bold"
                className="text-primary dark:text-white"
                width={34}
              />
              Monthly Email reports
            </div>
            <div className="p-3">
              <div className="p-5 dark:bg-content1 bg-content2 rounded-lg mb-16">
                <h1 className="text-xl font-bold">
                  Your financial report for {lastMonthFormatted}
                </h1>
                <div className="flex items-center gap-x-1 mb-[30px] text-xs text-default-600">
                  <div>Financal health status:</div>
                  <div className="rounded-full h-2.5 w-2.5 bg-success" />
                </div>
                <div className="text-default-600 text-sm">
                  This month, your financial landscape painted a pretty rose
                  picture! With a net cash flow of $5622.00, it seems like your
                  money management skills are on point....
                </div>
              </div>
            </div>
            <p className="text-default-500 absolute bottom-0 backdrop-blur-md backdrop-saturate-150 py-3 px-6 w-full">
              No need to dig through your finances to see how you are doing. Get
              a monthly reports in your inbox.
            </p>
          </CardBody>
        </Card>
        <Card
          isBlurred
          fullWidth
          className="p-0 border-none bg-background/60 dark:bg-default-100/50"
          shadow="sm"
        >
          <CardBody className="p-0 relative">
            <div className="flex gap-x-2 items-center px-6 pt-6">
              <Icon
                icon="solar:card-bold"
                className="text-primary dark:text-white"
                width={34}
              />
              Connect your data
            </div>
            <div className="p-3 flex flex-col gap-y-2 mb-24 md:mb-0">
              <div className="flex justify-between items-center gap-3">
                <div className="flex items-center gap-x-3 overflow-hidden w-full">
                  <div className="bank-card bg-secondary-400">C</div>
                  <div className="flex flex-col overflow-hidden text-ellipsis">
                    <div className="truncate block">Chase</div>
                    <div className="flex gap-x-2 text-xs text-default-400">
                      <div className="truncate block">*6789</div>
                    </div>
                  </div>
                </div>
                <div className="flex">
                  <Button
                    isIconOnly
                    fullWidth
                    isDisabled
                    className="md:flex w-full"
                    size="sm"
                    aria-label="remove bank"
                    color="danger"
                    variant="light"
                  >
                    <Icon icon="solar:close-circle-bold" width={22} />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center gap-3">
                <div className="flex items-center gap-x-3 overflow-hidden w-full">
                  <div className="bank-card bg-secondary-400">C</div>
                  <div className="flex flex-col overflow-hidden text-ellipsis">
                    <div className="truncate block">Charles Schwab</div>
                    <div className="flex gap-x-2 text-xs text-default-400">
                      <div className="truncate block">*4321</div>
                    </div>
                  </div>
                </div>
                <div className="flex">
                  <Button
                    isIconOnly
                    fullWidth
                    isDisabled
                    className="md:flex w-full"
                    size="sm"
                    aria-label="remove bank"
                    color="danger"
                    variant="light"
                  >
                    <Icon icon="solar:close-circle-bold" width={22} />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center gap-3">
                <div className="flex items-center gap-x-3 overflow-hidden w-full">
                  <div className="bank-card bg-secondary-400">C</div>
                  <div className="flex flex-col overflow-hidden text-ellipsis">
                    <div className="truncate block">Citibank Online</div>
                    <div className="flex gap-x-2 text-xs text-default-400">
                      <div className="truncate block">*6142</div>
                    </div>
                  </div>
                </div>
                <div className="flex">
                  <Button
                    isIconOnly
                    fullWidth
                    isDisabled
                    className="md:flex w-full"
                    size="sm"
                    aria-label="remove bank"
                    color="danger"
                    variant="light"
                  >
                    <Icon icon="solar:close-circle-bold" width={22} />
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-default-500 absolute bottom-0 backdrop-blur-md backdrop-saturate-150 py-3 px-6 w-full">
              Connect your bank account or import your transactions with a CSV
              file to track your finances.
            </p>
          </CardBody>
        </Card>
      </div>
      <div className="blur-background blur-2 flex self-center" />
    </section>
  );
}
