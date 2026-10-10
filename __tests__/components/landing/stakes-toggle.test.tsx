import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { StakesToggle } from "@/components/landing/stakes-toggle";
import en from "@/components/landing/copy/en";

const { stakes } = en;

describe("StakesToggle", () => {
  it("opens on the calm side", () => {
    render(<StakesToggle stakes={stakes} />);
    expect(screen.getByRole("button", { name: stakes.with })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    for (const line of stakes.good) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
    expect(screen.queryByText(stakes.bad[0])).not.toBeInTheDocument();
  });

  it("shows the other side on tap", () => {
    render(<StakesToggle stakes={stakes} />);
    fireEvent.click(screen.getByRole("button", { name: stakes.without }));

    expect(
      screen.getByRole("button", { name: stakes.without }),
    ).toHaveAttribute("aria-pressed", "true");
    for (const line of stakes.bad) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
    expect(screen.queryByText(stakes.good[0])).not.toBeInTheDocument();
  });

  it("groups the two buttons under the section title", () => {
    render(<StakesToggle stakes={stakes} />);
    expect(
      screen.getByRole("group", { name: stakes.title }),
    ).toBeInTheDocument();
  });

  it("announces which side is showing, not every line", () => {
    const { container } = render(<StakesToggle stakes={stakes} />);
    const live = container.querySelector("[aria-live='polite']");
    expect(live).toHaveTextContent(stakes.with);
    expect(live?.textContent).toBe(stakes.with);

    fireEvent.click(screen.getByRole("button", { name: stakes.without }));
    expect(live).toHaveTextContent(stakes.without);
  });
});
