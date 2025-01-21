"use client";

import type { RadioProps } from "@heroui/radio";

import React from "react";
import { Radio } from "@heroui/radio";
import { cn } from "@heroui/theme";
import { Icon } from "@iconify/react";

export type PlanRadioProps = RadioProps & {
  price: string;
  label?: string;
};

const PlanRadio = React.forwardRef<HTMLInputElement, PlanRadioProps>(
  (
    { price, label, description, className, classNames = {}, ...props },
    ref
  ) => (
    <Radio
      {...props}
      ref={ref}
      classNames={{
        ...classNames,
        base: cn(
          "inline-flex m-0 px-3 py-4 max-w-[100%] items-center justify-between",
          "flex-row-reverse w-full cursor-pointer rounded-lg 3 border-medium border-default-100",
          "data-[selected=true]:border-primary data-[selected=true]:bg-primary-50",
          classNames?.base,
          className
        ),
        wrapper: cn(
          "group-data-[focus-visible=true]:ring-primary",
          classNames?.wrapper
        ),
        labelWrapper: cn("ml-0", classNames?.labelWrapper),
      }}
      color="primary"
    >
      <div className="flex w-full items-center gap-3">
        <div className="item-center flex rounded-full bg-primary-50 p-2 group-data-[selected=true]:bg-primary-100">
          <Icon
            className="text-primary"
            icon="solar:box-minimalistic-linear"
            width={18}
          />
        </div>
        <div className="flex w-full flex-col gap-1">
          <div className="flex items-center gap-1">
            <p className="text-small">{label}</p>
            <span className="mt-0.5 text-tiny text-success-500">{price}</span>
          </div>
          <p className="text-tiny text-default-400">{description}</p>
        </div>
      </div>
    </Radio>
  )
);

PlanRadio.displayName = "PlanRadio";

export default PlanRadio;
