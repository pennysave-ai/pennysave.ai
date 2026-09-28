import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Icon } from "@iconify/react";
import CurrencyInput from "react-currency-input-field";
import { cn } from "@heroui/theme";
import { ReactElement } from "react";
import { MAX_TRANSACTION_AMOUNT } from "@/constants";

interface AmountInputProps {
  value: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: string;
  prefix: string;
  maxValue?: number;
}
export default function AmountInput({
  value,
  onChange,
  disabled,
  placeholder,
  isInvalid,
  errorMessage,
  prefix,
  maxValue = MAX_TRANSACTION_AMOUNT,
}: AmountInputProps): ReactElement {
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
  const formattedMaxValue = maxValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Flag an over-limit amount while typing, so the user learns about the cap
  // before submitting rather than from the form error afterwards.
  const isOverLimit =
    !Number.isNaN(parsedValue) && Math.abs(parsedValue) > maxValue;

  const handleValueChange = (newValue: string | undefined) => {
    onChange(newValue);
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
        maxLength={String(maxValue).length}
        name="Amount"
        aria-label="Amount"
        prefix={prefix}
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn([
          "w-full px-3 py-2 pl-14 relative inline-flex tap-highlight-transparent shadow-sm border-medium border-default-200 data-[hover=true]:border-default-400 group-data-[focus=true]:border-default-foreground min-h-10 rounded-medium flex-col items-start justify-center gap-0 !duration-150 transition-colors motion-reduce:transition-none h-14",
          (isInvalid || isOverLimit) && "!border-danger",
        ])}
      />
      {isOverLimit && (
        <div className="text-sm text-danger mt-1">
          Amount cannot be greater than {prefix}
          {formattedMaxValue}
        </div>
      )}
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
