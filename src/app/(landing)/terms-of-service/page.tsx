import type { Metadata } from "next";
import LegalPage from "@/components/landing/legal-page";
import { loadCopy } from "@/components/landing/i18n";
import { getVisitorLocale } from "@/components/landing/visitor-locale";

export const metadata: Metadata = {
  title: "Terms of Service — PennySave.ai",
};

export default async function TermsOfService() {
  const { lang } = await getVisitorLocale();
  return <LegalPage id="terms" lang={lang} t={await loadCopy(lang)} />;
}
