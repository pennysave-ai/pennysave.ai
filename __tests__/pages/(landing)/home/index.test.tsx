import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import HomePage from "../../../../src/app/(landing)/page";
import type { StorePrices } from "@/lib/appStorePrice";

const request = {
  cookie: undefined as string | undefined,
  acceptLanguage: "en-US,en",
  country: undefined as string | undefined,
};
let prices: StorePrices = {};

jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({
    get: (name: string) =>
      name === "pennysave-landing-lang" && request.cookie
        ? { value: request.cookie }
        : undefined,
  })),
  headers: jest.fn(async () => {
    const h = new Headers({ "accept-language": request.acceptLanguage });
    if (request.country) h.set("x-vercel-ip-country", request.country);
    return h;
  }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));
// App Store Connect is covered in __tests__/lib/appStorePrice.test.ts.
jest.mock("@/lib/appStorePrice", () => ({
  getPremiumPrices: jest.fn(async () => prices),
}));

const renderPage = async () => render(await HomePage());
const pricingCard = () =>
  screen.getByRole("heading", { level: 3, name: "Premium" }).closest("div")!
    .parentElement!;

describe("HomePage", () => {
  afterEach(() => {
    request.cookie = undefined;
    request.acceptLanguage = "en-US,en";
    request.country = undefined;
    prices = {};
  });

  it("renders in English by default", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Know where every penny goes.",
    );
  });

  it("renders in the visitor's saved language", async () => {
    request.cookie = "de";
    await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Wisse, wohin jeder Cent geht.",
    );
  });

  it("tells screen readers that download links open the App Store", async () => {
    await renderPage();
    const storeLinks = screen
      .getAllByRole("link")
      .filter((a) =>
        a.getAttribute("href")?.startsWith("https://apps.apple.com"),
      );
    expect(storeLinks.length).toBeGreaterThan(0);
    for (const link of storeLinks) {
      expect(link).toHaveTextContent("(opens the App Store)");
      expect(link).toHaveAttribute("target", "_blank");
    }
  });

  it("offers a skip link to the main content", async () => {
    await renderPage();
    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", "#main");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });

  it("shows the Premium price for the language's store, read out in words", async () => {
    prices = { USA: { amount: "4.99", currency: "USD", period: "ONE_MONTH" } };
    await renderPage();
    const card = pricingCard();
    expect(within(card).getByText("$4.99")).toBeInTheDocument();
    expect(within(card).getByText("/ month")).toHaveAttribute("aria-hidden");
    expect(within(card).getByText("per month")).toHaveClass("sr-only");
  });

  it("prices by the visitor's country before their language", async () => {
    request.country = "GB";
    prices = {
      USA: { amount: "4.99", currency: "USD", period: "ONE_MONTH" },
      GBR: { amount: "4.49", currency: "GBP", period: "ONE_MONTH" },
    };
    await renderPage();
    expect(within(pricingCard()).getByText("£4.49")).toBeInTheDocument();
  });

  it("leaves the price out when the store's price is unavailable", async () => {
    await renderPage();
    expect(within(pricingCard()).queryByText(/\$/)).not.toBeInTheDocument();
  });

  it("lists the trust facts next to the pricing download button", async () => {
    await renderPage();
    for (const fact of [
      "iPhone only",
      "No bank login needed",
      "Cancel any time in the App Store",
    ]) {
      expect(screen.getByText(fact)).toBeInTheDocument();
    }
  });
});
