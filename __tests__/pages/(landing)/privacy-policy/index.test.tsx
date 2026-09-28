import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import PrivacyPolicy from "../../../../src/app/(landing)/privacy-policy/page";
import { getLegalDocument } from "@/data/legal";

describe("PrivacyPolicyPage", () => {
  it("renders a heading with Privacy Policy", () => {
    render(<PrivacyPolicy />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Privacy Policy");
  });
  it("renders the effective date", () => {
    render(<PrivacyPolicy />);
    expect(screen.getByText("Effective May 1, 2025")).toBeInTheDocument();
  });
  it("labels the plain-language summary as not binding", () => {
    render(<PrivacyPolicy />);
    expect(
      screen.getByText(getLegalDocument("privacy").summary),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/A summary, not the agreement/),
    ).toBeInTheDocument();
  });
  it("renders every section of the document", () => {
    render(<PrivacyPolicy />);
    for (const section of getLegalDocument("privacy").sections) {
      expect(
        screen.getByRole("heading", { level: 2, name: section.title }),
      ).toBeInTheDocument();
    }
  });
});
