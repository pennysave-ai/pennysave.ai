import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import PrivacyPolicy from "../../../../src/app/(unprotected)/privacy-policy/page";

describe("PrivacyPolicyPage", () => {
  it("renders a heading with Privacy Policy", () => {
    render(<PrivacyPolicy />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Privacy Policy");
  });
  it("renders a subheading with Effective Date", () => {
    render(<PrivacyPolicy />);
    const subheading = screen.getByText(/Effective Date/);
    expect(subheading).toBeInTheDocument();
  });
});
