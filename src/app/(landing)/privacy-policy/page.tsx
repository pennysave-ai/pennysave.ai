import type { Metadata } from "next";
import LegalPage from "@/components/landing/legal-page";
import { loadCopy } from "@/components/landing/i18n";
import { getVisitorLocale } from "@/components/landing/visitor-locale";

export const metadata: Metadata = {
  title: "Privacy Policy — PennySave.ai",
};

export default async function PrivacyPolicy() {
  const { lang } = await getVisitorLocale();
  return <LegalPage id="privacy" lang={lang} t={await loadCopy(lang)} />;
}
