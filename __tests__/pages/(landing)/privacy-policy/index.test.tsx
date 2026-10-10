import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import PrivacyPolicy from "../../../../src/app/(landing)/privacy-policy/page";
import { getLegalDocument } from "@/data/legal";

// The page is a server component that reads the visitor's language from the
// request; this visitor has no cookie and an English browser.
jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({ get: () => undefined })),
  headers: jest.fn(async () => new Headers({ "accept-language": "en-US,en" })),
}));
// The header's language switcher refreshes through the router.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

const renderPage = async () => render(await PrivacyPolicy());

describe("PrivacyPolicyPage", () => {
  it("renders a heading with Privacy Policy", async () => {
    await renderPage();
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Privacy Policy");
  });
  it("renders the effective date", async () => {
    await renderPage();
    expect(screen.getByText("Effective May 1, 2025")).toBeInTheDocument();
  });
  it("labels the plain-language summary as not binding", async () => {
    await renderPage();
    expect(
      screen.getByText(getLegalDocument("privacy").summary),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/A summary, not the agreement/),
    ).toBeInTheDocument();
  });
  it("renders every section of the document", async () => {
    await renderPage();
    for (const section of getLegalDocument("privacy").sections) {
      expect(
        screen.getByRole("heading", { level: 2, name: section.title }),
      ).toBeInTheDocument();
    }
  });
});
