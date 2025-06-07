"use client";
import { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button, ButtonGroup } from "@heroui/button";
import { DateRangePicker } from "@heroui/date-picker";
import { useDisclosure } from "@heroui/modal";
import {
  useGetTransactions,
  type TransactionResponseItem,
} from "@/features/transactions/hooks";
import {
  today,
  startOfWeek,
  startOfMonth,
  getLocalTimeZone,
  CalendarDate,
} from "@internationalized/date";
import TransactionsTable from "./transactions-table";
import Sidebar from "./sidebar";
import { useLocale } from "@react-aria/i18n";
import { DateValue, RangeValue } from "@heroui/calendar";

interface TransactionsHistoryProps {
  onBulkUpload: () => void;
}

interface SidebarHandle {
  openSidebar: (transaction: TransactionResponseItem) => void;
}

export default function TransactionsHistory({
  onBulkUpload,
}: TransactionsHistoryProps) {
  const { locale } = useLocale();
  const now = today(getLocalTimeZone());
  const [tableSettings, setTableSettings] = useState<{
    currentPage: number;
    pageSize: number;
    sortBy: {
      column: string;
      direction: "ascending" | "descending";
    };
    globalFilter: string;
    start?: CalendarDate;
    end?: CalendarDate;
  }>({
    currentPage: 1,
    pageSize: 50,
    sortBy: {
      column: "createdAt",
      direction: "descending",
    },
    start: startOfMonth(now),
    end: now,
    globalFilter: "",
  });
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const sideBarRef = useRef<SidebarHandle>(null);

  const onOpenSidebar = (transaction: TransactionResponseItem) => {
    if (sideBarRef.current) {
      sideBarRef.current.openSidebar(transaction);
    }
  };

  const { data, isFetching } = useGetTransactions({
    sortBy: tableSettings.sortBy.column,
    sortDirection: tableSettings.sortBy.direction,
    globalFilter: tableSettings.globalFilter,
    page: tableSettings.currentPage.toFixed(0),
    pageSize: tableSettings.pageSize.toFixed(0),
    start: tableSettings.start?.toString() || "",
    end: tableSettings.end?.toString() || "",
  });

  const handleLast30DaysPress = () => {
    setTableSettings((prev) => ({
      ...prev,
      start: now.subtract({ days: 30 }),
      end: now,
      currentPage: 1,
    }));
  };

  const handleThisWeekPress = () => {
    setTableSettings((prev) => ({
      ...prev,
      start: startOfWeek(now, locale),
      end: now,
      currentPage: 1,
    }));
  };

  const handleThisMonthPress = () => {
    setTableSettings((prev) => ({
      ...prev,
      start: startOfMonth(now),
      end: now,
      currentPage: 1,
    }));
  };

  const handleChange = (value: RangeValue<DateValue> | null) => {
    setTableSettings((prev) => ({
      ...prev,
      start: value?.start as CalendarDate,
      end: value?.end as CalendarDate,
      currentPage: 1,
    }));
  };

  return (
    <div className="px-4 flex w-full flex-col items-center -mt-[72px] lg:-mt-36">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-1 lg:grid-cols-3 max-w-screen-2xl mx-auto w-full mb-4 place-content-end">
        <div className="grid w-full col-start-1 lg:col-start-3">
          <div className="grid w-full">
            <div className="flex flex-col gap-4 w-full">
              <DateRangePicker
                maxValue={today(getLocalTimeZone())}
                CalendarTopContent={
                  <ButtonGroup
                    fullWidth
                    className="px-3 pb-2 pt-3 bg-content1 [&>button]:text-default-500 [&>button]:border-default-200/60"
                    radius="full"
                    size="sm"
                    variant="bordered"
                  >
                    <Button className="text-xs" onPress={handleLast30DaysPress}>
                      Last 30 days
                    </Button>
                    <Button onPress={handleThisWeekPress}>This week</Button>
                    <Button onPress={handleThisMonthPress}>This month</Button>
                  </ButtonGroup>
                }
                calendarWidth={280}
                calendarProps={{
                  nextButtonProps: {
                    variant: "bordered",
                  },
                  prevButtonProps: {
                    variant: "bordered",
                  },
                }}
                label="Period"
                value={
                  tableSettings.start && tableSettings.end
                    ? {
                        start: tableSettings.start,
                        end: tableSettings.end,
                      }
                    : null
                }
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>
      <Card className="w-full p-8 max-w-screen-2xl">
        <div className="flex md:flex-row flex-col justify-between">
          <div>
            <div className="flex items-center md:mb-0 mb-4">
              <h1 className="text-2xl font-[700] leading-[32px]">History</h1>
              <Chip
                className="items-center text-default-500 ml-1 w-min-[10px]"
                size="sm"
                variant="flat"
              >
                {data?.meta?.count || null}
              </Chip>
            </div>
          </div>
          <div className="flex gap-3 md:flex-row flex-col">
            <Button
              color="primary"
              startContent={<Icon icon="solar:add-circle-bold" width={20} />}
              onPress={onOpen}
            >
              Add New
            </Button>
            <Button
              color="primary"
              startContent={
                <Icon icon="solar:upload-minimalistic-outline" width={20} />
              }
              onPress={onBulkUpload}
            >
              Bulk Upload
            </Button>
          </div>
          <Sidebar
            ref={sideBarRef}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
          />
        </div>
        <TransactionsTable
          tableSettings={tableSettings}
          setTableSettings={setTableSettings}
          data={data?.data}
          isLoading={isFetching}
          onOpenSidebar={onOpenSidebar}
          count={data?.meta?.count || 0}
        />
      </Card>
    </div>
  );
}
