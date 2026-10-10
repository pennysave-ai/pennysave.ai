import {
  PRICE_TERRITORIES,
  getVisitorLocale,
} from "@/components/landing/visitor-locale";

const request = {
  cookie: undefined as string | undefined,
  headers: {} as Record<string, string>,
};

jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({
    get: (name: string) =>
      name === "pennysave-landing-lang" && request.cookie
        ? { value: request.cookie }
        : undefined,
  })),
  headers: jest.fn(async () => new Headers(request.headers)),
}));

function visit(cookie?: string, headers: Record<string, string> = {}) {
  request.cookie = cookie;
  request.headers = headers;
  return getVisitorLocale();
}

describe("getVisitorLocale", () => {
  it("prefers the saved language over the browser's", async () => {
    await expect(
      visit("fr", { "accept-language": "de-DE,de" }),
    ).resolves.toMatchObject({ lang: "fr" });
  });

  it("ignores a saved value that isn't a language the site ships", async () => {
    await expect(
      visit("it", { "accept-language": "es" }),
    ).resolves.toMatchObject({ lang: "es" });
  });

  it("takes the browser's best supported language by quality", async () => {
    await expect(
      visit(undefined, {
        "accept-language": "it-IT;q=0.9,de;q=0.8,fr;q=0.95",
      }),
    ).resolves.toMatchObject({ lang: "fr" });
  });

  it("skips languages the browser rules out with q=0", async () => {
    await expect(
      visit(undefined, { "accept-language": "de;q=0,es;q=0.5" }),
    ).resolves.toMatchObject({ lang: "es" });
  });

  it("falls back to English", async () => {
    await expect(
      visit(undefined, { "accept-language": "ja-JP" }),
    ).resolves.toMatchObject({ lang: "en" });
    await expect(visit()).resolves.toMatchObject({ lang: "en" });
  });

  it("maps the visitor's country to its App Store territory", async () => {
    await expect(
      visit(undefined, { "x-vercel-ip-country": "gb" }),
    ).resolves.toMatchObject({ territory: "GBR" });
  });

  it("has no territory for an unknown or missing country", async () => {
    await expect(
      visit(undefined, { "x-vercel-ip-country": "JP" }),
    ).resolves.toMatchObject({ territory: null });
    await expect(visit()).resolves.toMatchObject({ territory: null });
  });
});

describe("PRICE_TERRITORIES", () => {
  it("covers every language's default store once", () => {
    for (const t of ["USA", "DEU", "FRA", "ESP", "GBR", "IRL"]) {
      expect(PRICE_TERRITORIES).toContain(t);
    }
    expect(new Set(PRICE_TERRITORIES).size).toBe(PRICE_TERRITORIES.length);
  });
});
