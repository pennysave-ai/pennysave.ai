import LandingPage from "@/components/landing/landing-page";
import { loadCopy } from "@/components/landing/i18n";
import {
  PRICE_TERRITORIES,
  getVisitorLocale,
} from "@/components/landing/visitor-locale";
import { getPremiumPrices } from "@/lib/appStorePrice";

// Rendered per request (language and country come from the request); the
// App Store prices themselves are cached for a day in getPremiumPrices.
export default async function HomePage() {
  const [{ lang, territory }, prices] = await Promise.all([
    getVisitorLocale(),
    getPremiumPrices(PRICE_TERRITORIES),
  ]);
  return (
    <LandingPage
      prices={prices}
      lang={lang}
      t={await loadCopy(lang)}
      territory={territory}
    />
  );
}
