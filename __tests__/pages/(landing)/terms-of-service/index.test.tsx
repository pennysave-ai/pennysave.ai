import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import TermsOfService from "../../../../src/app/(landing)/terms-of-service/page";
import { getLegalDocument } from "@/data/legal";

describe("TermsOfServicePage", () => {
  afterEach(() => localStorage.clear());

  it("renders a heading with Terms of Service", () => {
    render(<TermsOfService />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Terms of Service",
    );
  });

  it("marks the current document in the legal tabs", () => {
    render(<TermsOfService />);
    const nav = screen.getByRole("navigation", { name: "Legal documents" });
    expect(nav.querySelector('[aria-current="page"]')).toHaveAttribute(
      "href",
      "/terms-of-service",
    );
  });

  it("shows no translation notice for the English original", () => {
    render(<TermsOfService />);
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("follows the saved site language and flags the unreviewed translation", () => {
    localStorage.setItem("pennysave-landing-lang", "de");
    render(<TermsOfService />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      getLegalDocument("terms", "de").label,
    );
    expect(screen.getByRole("note")).toHaveTextContent(
      "Verbindlich ist die englische Fassung",
    );

    fireEvent.click(screen.getByRole("button", { name: "Auf Englisch lesen" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Terms of Service",
    );
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });
});
