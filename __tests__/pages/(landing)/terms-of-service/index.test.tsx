import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import TermsOfService from "../../../../src/app/(landing)/terms-of-service/page";
import { getLegalDocument } from "@/data/legal";

// What the server sees of the visitor: their language cookie and browser
// languages. Each test sets its own.
const request = {
  cookie: undefined as string | undefined,
  acceptLanguage: "en-US,en",
};

jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({
    get: (name: string) =>
      name === "pennysave-landing-lang" && request.cookie
        ? { value: request.cookie }
        : undefined,
  })),
  headers: jest.fn(
    async () => new Headers({ "accept-language": request.acceptLanguage }),
  ),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

const renderPage = async () => render(await TermsOfService());

describe("TermsOfServicePage", () => {
  afterEach(() => {
    request.cookie = undefined;
    request.acceptLanguage = "en-US,en";
  });

  it("renders a heading with Terms of Service", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Terms of Service",
    );
  });

  it("marks the current document in the legal tabs", async () => {
    await renderPage();
    const nav = screen.getByRole("navigation", { name: "Legal documents" });
    expect(nav.querySelector('[aria-current="page"]')).toHaveAttribute(
      "href",
      "/terms-of-service",
    );
  });

  it("shows no translation notice for the English original", async () => {
    await renderPage();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("follows the saved site language without a notice for a reviewed translation", async () => {
    request.cookie = "de";
    await renderPage();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      getLegalDocument("terms", "de").label,
    );
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("falls back to the browser's language when nothing is saved", async () => {
    request.acceptLanguage = "es-MX,es;q=0.9,en;q=0.5";
    await renderPage();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      getLegalDocument("terms", "es").label,
    );
  });

  it("labels the content with the language it is written in", async () => {
    request.cookie = "fr";
    const { container } = await renderPage();
    expect(container.querySelector("[lang='fr']")).toBeInTheDocument();
  });
});
