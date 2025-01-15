"use client";

import React, { useState, useEffect } from "react";

import { DateRangePicker } from "@nextui-org/date-picker";
import { Button, ButtonGroup } from "@nextui-org/button";
import {
  today,
  startOfWeek,
  startOfMonth,
  getLocalTimeZone,
  CalendarDate,
} from "@internationalized/date";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { useLocale } from "@react-aria/i18n";
import { DEFAULT_DATA_PERIOD } from "@/constants";
import { convertDateStringToCalendarDate } from "@/lib/utils";

export default function RangePicker() {
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const now = today(getLocalTimeZone());
  const router = useRouter();
  const pathname = usePathname();

  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const start = convertDateStringToCalendarDate(from);
  const end = convertDateStringToCalendarDate(to);

  const [value, setValue] = useState<{
    end: CalendarDate;
    start: CalendarDate;
  } | null>({
    end: end ? end : today(getLocalTimeZone()),
    start: start
      ? start
      : today(getLocalTimeZone()).subtract({ days: DEFAULT_DATA_PERIOD }),
  });

  useEffect(() => {
    const query = new URLSearchParams(searchParams);
    if (value?.start) {
      const from = `${value.start.year}-${value.start.month}-${value.start.day}`;
      query.set("from", from);
    }
    if (value?.end) {
      const to = `${value.end.year}-${value.end.month}-${value.end.day}`;
      query.set("to", to);
    }
    router.push(`${pathname}?${query.toString()}`);
  }, [value?.end, value?.start]);

  return (
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
            <Button
              className="text-xs"
              onPress={() => {
                setValue({
                  start: now.subtract({ days: 30 }),
                  end: now,
                });
              }}
            >
              Last 30 days
            </Button>
            <Button
              onPress={() => {
                setValue({
                  start: startOfWeek(now, locale),
                  end: now,
                });
              }}
            >
              This week
            </Button>
            <Button
              onPress={() =>
                setValue({
                  start: startOfMonth(now),
                  end: now,
                })
              }
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
          classNames: {
            // base: "bg-background-100",
          },
        }}
        label="Data range"
        value={value}
        onChange={setValue}
      />
    </div>
  );
}
