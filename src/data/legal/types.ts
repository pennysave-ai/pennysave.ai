/**
 * Shared shape of the legal documents.
 *
 * One document, one structure, four languages: each language file under this
 * directory exports the same sections in the same order, so a client can switch
 * language without the document changing shape underneath it.
 */

export type LegalDocumentId = "terms" | "privacy";

/** The languages the mobile app ships. */
export type LegalLanguage = "en" | "es" | "de" | "fr";

export const LANGUAGES: LegalLanguage[] = ["en", "es", "de", "fr"];

/** The language the documents are written and reviewed in; everything else is a translation of it. */
export const SOURCE_LANGUAGE: LegalLanguage = "en";

export type LegalSection = {
  title: string;
  body: string;
  points: string[];
};

/**
 * A phrase inside the document that should render as a link.
 *
 * Kept per language because the phrase itself is translated — German readers
 * need "Datenschutzrichtlinie" linked, not "Privacy Policy". Email addresses
 * and absolute URLs are detected automatically and need no entry here.
 */
export type LegalLink = {
  phrase: string;
  href: string;
};

/** Everything about a document that differs between languages. */
export type LegalDocumentCopy = {
  label: string;
  /**
   * NOT part of the agreement — a plain-language gloss. Every surface that
   * shows it must say so.
   */
  summary: string;
  sections: LegalSection[];
  links?: LegalLink[];
};

export type LegalCatalogEntry = {
  /**
   * Whether this language's text has been through legal review.
   *
   * A translated Terms of Service or Privacy Policy is a legal document in its
   * own right. Unreviewed translations are still served — a reader is better
   * off with their own language than with English they may not read — but they
   * are flagged all the way out to the client, which must show that the
   * English version governs. Flip this to `true` only once the text has
   * actually been reviewed.
   */
  reviewed: boolean;
  documents: Record<LegalDocumentId, LegalDocumentCopy>;
};

/**
 * The facts that do not change between languages.
 *
 * Kept out of the language files so a translation cannot quietly disagree with
 * the source about when the document took effect.
 */
export const DOCUMENT_META: Record<
  LegalDocumentId,
  { effectiveDate: string; url: string }
> = {
  terms: {
    /** ISO-8601; clients format it for their own locale. */
    effectiveDate: "2025-06-10",
    url: "https://pennysave.ai/terms-of-service",
  },
  privacy: {
    effectiveDate: "2025-05-01",
    url: "https://pennysave.ai/privacy-policy",
  },
};

/** A document as it is served: language-independent facts plus translated copy. */
export type LegalDocument = LegalDocumentCopy & {
  id: LegalDocumentId;
  effectiveDate: string;
  url: string;
};
