import { cookies, headers } from "next/headers";
import { LANG_COOKIE, LANGS, STORE_TERRITORY, type Lang } from "./i18n";

/**
 * Countries whose App Store price the site can show, ISO 3166-1 alpha-2 (what
 * Vercel's geo header sends) -> App Store territory (alpha-3). Visitors from
 * anywhere else see the price of their language's default territory.
 */
const COUNTRY_TERRITORY: Record<string, string> = {
  US: "USA",
  GB: "GBR",
  IE: "IRL",
  CA: "CAN",
  AU: "AUS",
  NZ: "NZL",
  DE: "DEU",
  AT: "AUT",
  CH: "CHE",
  FR: "FRA",
  BE: "BEL",
  LU: "LUX",
  NL: "NLD",
  IT: "ITA",
  PT: "PRT",
  ES: "ESP",
  MX: "MEX",
};

/** Every territory whose Premium price is fetched for the landing page. */
export const PRICE_TERRITORIES = [
  ...new Set([
    ...Object.values(COUNTRY_TERRITORY),
    ...Object.values(STORE_TERRITORY),
  ]),
];

const isLang = (l: string | undefined): l is Lang =>
  LANGS.some((x) => x.code === l);

/** Accept-Language, best first: "de-AT,de;q=0.9,en;q=0.8" -> ["de", "de", "en"]. */
function acceptedLanguages(header: string | null) {
  return (header ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return {
        lang: tag.slice(0, 2).toLowerCase(),
        q: q ? Number(q.split("=")[1]) : 1,
      };
    })
    .filter((l) => l.lang && l.q > 0)
    .sort((a, b) => b.q - a.q)
    .map((l) => l.lang);
}

/**
 * The language and price territory to render for this request, so the first
 * paint is already in the visitor's language with their store's price.
 *
 * Language: the saved choice (cookie) > Accept-Language > English.
 * Territory: the visitor's country when the site knows its price; otherwise
 * null, and the page falls back to the language's default territory.
 */
export async function getVisitorLocale(): Promise<{
  lang: Lang;
  territory: string | null;
}> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);

  const saved = cookieStore.get(LANG_COOKIE)?.value;
  const lang =
    [saved, ...acceptedLanguages(headerList.get("accept-language"))].find(
      isLang,
    ) ?? "en";

  const country = headerList.get("x-vercel-ip-country")?.toUpperCase();
  const territory = (country && COUNTRY_TERRITORY[country]) || null;

  return { lang, territory };
}
