import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import LegalDocumentContent, {
  formatEffectiveDate,
} from "@/components/common/legal-document-content";
import { getLegalDocument } from "@/data/legal";

describe("LegalDocumentContent", () => {
  it("renders every section title as a heading line", () => {
    const document = getLegalDocument("privacy");
    render(<LegalDocumentContent document={document} />);
    for (const section of document.sections) {
      expect(screen.getByText(section.title)).toBeInTheDocument();
    }
  });

  it("turns email addresses into mailto links", () => {
    render(<LegalDocumentContent document={getLegalDocument("privacy")} />);
    const [email] = screen.getAllByText("support@pennysave.ai");
    expect(email).toHaveAttribute("href", "mailto:support@pennysave.ai");
  });

  it("links the document's own phrases, not bare text", () => {
    render(<LegalDocumentContent document={getLegalDocument("terms")} />);
    const [crossReference] = screen.getAllByText("Privacy Policy");
    expect(crossReference).toHaveAttribute("href", "/privacy-policy");
  });

  it("opens absolute URLs in a new tab", () => {
    render(<LegalDocumentContent document={getLegalDocument("terms")} />);
    const link = screen.getByText("http://pennysave.ai");
    expect(link).toHaveAttribute("href", "http://pennysave.ai");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders translated documents with their own linked phrases", () => {
    render(<LegalDocumentContent document={getLegalDocument("terms", "fr")} />);
    const [crossReference] = screen.getAllByText(
      "Politique de Confidentialité",
    );
    expect(crossReference).toHaveAttribute("href", "/privacy-policy");
  });

  it("formats the effective date in UTC, so it never slips a day", () => {
    expect(formatEffectiveDate("2025-05-01")).toBe("May 1, 2025");
    expect(formatEffectiveDate("2025-06-10")).toBe("Jun 10, 2025");
  });
});
