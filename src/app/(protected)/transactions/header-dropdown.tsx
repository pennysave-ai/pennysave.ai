import React from "react";

import { Button } from "@heroui/button";
import { Selection } from "@heroui/table";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { cn } from "@heroui/theme";
import { Icon } from "@iconify/react/dist/iconify.js";

interface HeaderDropdownProps {
  disabledKeys: string[];
  columnIndex: number;
  onChange: (columnIndex: number, value: string | null) => void;
}

const options = ["amount", "payee", "notes", "date"];

export default function HeaderDropdown({
  disabledKeys,
  columnIndex,
  onChange,
}: HeaderDropdownProps) {
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set(["select"])
  );

  const selectedValue = React.useMemo(
    () => Array.from(selectedKeys).join(", ").replace(/_/g, ""),
    [selectedKeys]
  );

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          className={cn(
            "capitalize text-foreground-500 semi-bold font-semibold text-tiny rounded-none",
            {
              "text-primary": options.includes(selectedValue),
            }
          )}
          variant="light"
          endContent={<Icon icon="solar:alt-arrow-down-line-duotone" />}
        >
          {selectedValue}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Single selection example"
        selectedKeys={selectedKeys}
        disabledKeys={disabledKeys.filter((key) => key != selectedValue)}
        selectionMode="single"
        variant="flat"
        onSelectionChange={(value) => {
          if (value.currentKey) {
            setSelectedKeys(new Set([value.currentKey]));
          } else {
            setSelectedKeys(new Set(["select"]));
          }
          onChange(columnIndex, value.currentKey || null);
        }}
      >
        {options.map((option) => (
          <DropdownItem className="capitalize" key={option}>
            {option}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
