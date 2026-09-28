import type { Metadata } from "next";
import LegalPage from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service — PennySave.ai",
};

export default function TermsOfService() {
  return <LegalPage id="terms" />;
}
