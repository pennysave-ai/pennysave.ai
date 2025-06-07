"use client";

import React, { useState } from "react";

import { DateRangePicker } from "@heroui/date-picker";
import { Button, ButtonGroup } from "@heroui/button";
import {
  today,
  startOfWeek,
  startOfMonth,
  getLocalTimeZone,
  CalendarDate,
} from "@internationalized/date";

import { useLocale } from "@react-aria/i18n";

interface RangePickerProps {
  start: CalendarDate;
  end: CalendarDate;
  onDateRangeChange: ({
    start,
    end,
  }: {
    start: CalendarDate;
    end: CalendarDate;
  }) => void;
}

export default function RangePicker({
  onDateRangeChange,
  start,
  end,
}: RangePickerProps) {
  const { locale } = useLocale();
  const now = today(getLocalTimeZone());
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="flex flex-col gap-4 w-full">
      <DateRangePicker
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        maxValue={today(getLocalTimeZone())}
        CalendarTopContent={
          <ButtonGroup
            fullWidth
            className="px-3 pb-2 pt-3 bg-content1 [&>button]:text-default-500 [&>button]:border-default-200/60"
            radius="full"
            size="sm"
            variant="bordered"
          >
            <Button
              className="text-xs"
              onPress={() => {
                setIsOpen(false);
                onDateRangeChange({
                  start: now.subtract({ days: 30 }),
                  end: now,
                });
              }}
            >
              Last 30 days
            </Button>
            <Button
              onPress={() => {
                setIsOpen(false);
                onDateRangeChange({
                  start: startOfWeek(now, locale),
                  end: now,
                });
              }}
            >
              This week
            </Button>
            <Button
              onPress={() => {
                setIsOpen(false);
                onDateRangeChange({
                  start: startOfMonth(now),
                  end: now,
                });
              }}
            >
              This month
            </Button>
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
        value={{ start, end }}
        onChange={(value) => {
          if (value) {
            onDateRangeChange({
              start: value.start as CalendarDate,
              end: value.end as CalendarDate,
            });
          }
        }}
      />
    </div>
  );
}
