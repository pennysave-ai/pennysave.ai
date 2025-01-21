import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Icon } from "@iconify/react";
import CurrencyInput from "react-currency-input-field";
import { cn } from "@heroui/theme";

interface AmountInputProps {
  value: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: string;
  prefix: string;
}
export default function AmountInput({
  value,
  onChange,
  disabled,
  placeholder,
  isInvalid,
  errorMessage,
  prefix,
}: AmountInputProps): JSX.Element {
  const parsedValue = parseFloat(value);
  const isIncome = parsedValue > 0;
  const isExpence = parsedValue < 0;

  const onReverseValueHandler = () => {
    if (!value) return;
    const newValue = parseFloat(value) * -1;
    onChange(newValue.toString());
  };
  const getColor = () => {
    if (isIncome) return "success";
    if (isExpence) return "danger";
    return "default";
  };
  return (
    <div className="relative">
      <Tooltip content="Use [+] to add income and [-] to add expence">
        <Button
          className="absolute top-2 left-1.5 transition z-10 text-white"
          isIconOnly
          aria-label="Reverse value"
          color={getColor()}
          onPress={onReverseValueHandler}
        >
          {!parsedValue && (
            <Icon
              color="currentColor"
              icon="solar:info-circle-bold"
              width={20}
            />
          )}
          {isIncome && (
            <Icon
              color="currentColor"
              icon="solar:add-circle-bold"
              width={20}
            />
          )}
          {isExpence && (
            <Icon
              color="currentColor"
              icon="solar:minus-circle-bold"
              className=""
              width={20}
            />
          )}
        </Button>
      </Tooltip>
      <CurrencyInput
        id="amount"
        maxLength={12}
        aria-label="Amount"
        prefix={prefix}
        value={value}
        onValueChange={(value) => onChange(value)}
        disabled={disabled}
        placeholder={placeholder}
        className={cn([
          "w-full px-3 py-2 pl-14 relative inline-flex tap-highlight-transparent shadow-sm border-medium border-default-200 data-[hover=true]:border-default-400 group-data-[focus=true]:border-default-foreground min-h-10 rounded-medium flex-col items-start justify-center gap-0 !duration-150 transition-colors motion-reduce:transition-none h-14",
          isInvalid && "!border-danger",
        ])}
      />
      {(isExpence || isIncome) && (
        <div className="text-default-500 text-sm mt-1">
          Will be count as an {isExpence ? "expence" : "income"}
        </div>
      )}
      {isInvalid && (
        <div className="text-sm text-danger mt-1">{errorMessage}</div>
      )}
    </div>
  );
}
