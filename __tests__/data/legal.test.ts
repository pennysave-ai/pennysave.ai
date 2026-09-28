/**
 * @jest-environment node
 */
import {
  getLegalDocument,
  getLegalDocuments,
  normalizeLanguage,
  LANGUAGES,
  SOURCE_LANGUAGE,
  type LegalLanguage,
} from "@/data/legal";

const TRANSLATIONS = LANGUAGES.filter((l) => l !== SOURCE_LANGUAGE);

describe("legal documents", () => {
  describe("normalizeLanguage", () => {
    it.each([
      ["es", "es"],
      ["ES", "es"],
      ["es-ES", "es"],
      ["de_DE", "de"],
      ["fr-CA,fr;q=0.9", "fr"],
    ])("resolves %s to %s", (input, expected) => {
      expect(normalizeLanguage(input)).toBe(expected);
    });

    it.each([null, undefined, "", "   ", "pt", "klingon"])(
      "falls back to the source language for %p",
      (input) => {
        expect(normalizeLanguage(input)).toBe(SOURCE_LANGUAGE);
      },
    );
  });

  describe("getLegalDocuments", () => {
    it("serves the requested language when we ship it", () => {
      const result = getLegalDocuments("de");
      expect(result.language).toBe("de");
      expect(result.isSourceLanguage).toBe(false);
      expect(result.documents.map((d) => d.id)).toEqual(["terms", "privacy"]);
    });

    it("marks English as the reviewed, binding original", () => {
      const result = getLegalDocuments("en");
      expect(result.reviewed).toBe(true);
      expect(result.isSourceLanguage).toBe(true);
      expect(result.sourceLanguage).toBe(SOURCE_LANGUAGE);
    });

    it.each(TRANSLATIONS)(
      "marks the %s translation as reviewed",
      (language) => {
        const result = getLegalDocuments(language);
        expect(result.reviewed).toBe(true);
        expect(result.isSourceLanguage).toBe(false);
      },
    );

    it("advertises every language it can serve", () => {
      expect(getLegalDocuments("en").availableLanguages).toEqual(LANGUAGES);
    });

    it("reports a positive read time and a section count per document", () => {
      for (const doc of getLegalDocuments("fr").documents) {
        expect(doc.readMinutes).toBeGreaterThan(0);
        expect(doc.sectionCount).toBe(doc.sections.length);
      }
    });
  });

  describe("translation parity", () => {
    // A client renders whatever it is served: if a translation drops or
    // reorders a section, readers of that language silently get a different
    // document from the one that binds them.
    it.each(TRANSLATIONS)(
      "%s has the same sections, in the same order, as the source",
      (language: LegalLanguage) => {
        for (const id of ["terms", "privacy"] as const) {
          const source = getLegalDocument(id, SOURCE_LANGUAGE);
          const translated = getLegalDocument(id, language);

          expect(translated.sections).toHaveLength(source.sections.length);
          translated.sections.forEach((section, i) => {
            expect(section.title.trim()).not.toBe("");
            expect(section.points).toHaveLength(
              source.sections[i].points.length,
            );
            // An empty body in the source means a section that is only bullets.
            expect(section.body === "").toBe(source.sections[i].body === "");
          });
        }
      },
    );

    it.each(LANGUAGES)(
      "%s keeps the effective dates of the source",
      (language: LegalLanguage) => {
        expect(getLegalDocument("terms", language).effectiveDate).toBe(
          getLegalDocument("terms", SOURCE_LANGUAGE).effectiveDate,
        );
        expect(getLegalDocument("privacy", language).effectiveDate).toBe(
          getLegalDocument("privacy", SOURCE_LANGUAGE).effectiveDate,
        );
      },
    );

    it.each(LANGUAGES)(
      "%s only declares link phrases that appear in its own text",
      (language: LegalLanguage) => {
        for (const id of ["terms", "privacy"] as const) {
          const doc = getLegalDocument(id, language);
          const text = doc.sections
            .flatMap((s) => [s.body, ...s.points])
            .join(" ");
          for (const link of doc.links ?? []) {
            expect(text).toContain(link.phrase);
          }
        }
      },
    );

    it.each(LANGUAGES)("%s keeps the support address", (language) => {
      const text = getLegalDocument("privacy", language)
        .sections.flatMap((s) => [s.body, ...s.points])
        .join(" ");
      expect(text).toContain("support@pennysave.ai");
    });
  });
});
