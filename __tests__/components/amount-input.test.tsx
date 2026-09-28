import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import AmountInput from "@/components/amount-input";
import { MAX_TRANSACTION_AMOUNT } from "@/constants";

// The tooltip lazy-loads framer-motion, which Jest cannot import dynamically.
jest.mock("@heroui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function ControlledAmountInput({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <AmountInput
      value={value}
      onChange={(newValue) => setValue(newValue ?? "")}
      prefix="$"
    />
  );
}

describe("AmountInput", () => {
  it("accepts an amount at the limit", async () => {
    const user = userEvent.setup();
    render(<ControlledAmountInput />);
    const input = screen.getByLabelText("Amount");

    await user.type(input, String(MAX_TRANSACTION_AMOUNT));

    expect(input).toHaveValue("$999,999.99");
    expect(
      screen.queryByText(/Amount cannot be greater than/)
    ).not.toBeInTheDocument();
  });

  it("flags an amount over the limit and says why", async () => {
    const user = userEvent.setup();
    render(<ControlledAmountInput initialValue="100" />);
    const input = screen.getByLabelText("Amount");

    await user.clear(input);
    await user.type(input, "1000000");

    expect(input).toHaveValue("$1,000,000");
    expect(
      screen.getByText("Amount cannot be greater than $999,999.99")
    ).toBeInTheDocument();
  });
});
