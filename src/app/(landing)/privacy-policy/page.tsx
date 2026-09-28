import type { Metadata } from "next";
import LegalPage from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — PennySave.ai",
};

export default function PrivacyPolicy() {
  return <LegalPage id="privacy" />;
}
