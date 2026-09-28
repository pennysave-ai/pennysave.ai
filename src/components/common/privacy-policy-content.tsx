import LegalDocumentContent from "@/components/common/legal-document-content";
import { getLegalDocument } from "@/data/legal";

/**
 * The Privacy Policy, rendered from the shared source in `@/data/legal` — the
 * same text /api/legal serves to the mobile app.
 *
 * Always English; the public legal pages follow the site language instead.
 */
export default function PrivacyPolicyContent() {
  return <LegalDocumentContent document={getLegalDocument("privacy")} />;
}
