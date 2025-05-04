import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";

interface IconPickerProps {
  pickedIcon: string;
  onIconChange: (icon: string) => void;
}

export default function IconPicker({
  pickedIcon,
  onIconChange,
}: IconPickerProps) {
  const icons = [
    "mdi:food",
    "solar:basketball-bold",
    "solar:hanger-bold",
    "gis:car",
    "solar:bus-bold",
    "solar:confetti-bold",
    "solar:cup-paper-bold",
    "solar:wineglass-triangle-bold",
    "solar:clapperboard-open-bold",
    "solar:buildings-bold-duotone",
    "solar:gas-station-bold",
    "solar:globus-bold",
    "solar:hand-heart-bold",
    "solar:headphones-round-bold",
    "solar:armchair-2-bold",
    "solar:bag-5-bold",
    "cbi:netflix-alt",
    "solar:cosmetic-bold",
    "solar:diploma-verified-bold",
    "solar:pallete-2-bold",
    "solar:box-bold",
    "solar:gamepad-bold",
    "solar:code-circle-bold",
    "solar:paint-roller-bold",
    "solar:pills-bold",
    "solar:shop-2-bold",
    "solar:user-id-bold",
  ]; // your icon set

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          size="lg"
          variant="flat"
          className="absolute z-10 right-1 top-1 rounded-md"
          isIconOnly
        >
          <Icon icon={pickedIcon} width={24} color="text-default-500" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Icon selection"
        className="min-w-[240px] max-h-30 overflow-auto"
        itemClasses={{
          base: "data-[hover=true]:bg-default-100 flex-shrink-0",
        }}
        classNames={{
          list: "grid grid-cols-4 gap-1 p-2", // This creates the grid layout
        }}
        items={icons.map((icon) => ({ key: icon, label: icon }))}
        variant="flat"
      >
        {(item) => (
          <DropdownItem
            key={item.key}
            className="w-10 h-10 p-0 m-0 flex justify-center"
            textValue={item.label}
            onClick={() => onIconChange(item.key)}
          >
            <Icon
              className="w-10"
              icon={item.key}
              width={24}
              color="text-default-500"
            />
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
