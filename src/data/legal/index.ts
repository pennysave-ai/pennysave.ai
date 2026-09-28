import {
  DOCUMENT_META,
  LANGUAGES,
  SOURCE_LANGUAGE,
  type LegalCatalogEntry,
  type LegalDocument,
  type LegalDocumentId,
  type LegalLanguage,
} from "./types";
import en from "./en";
import es from "./es";
import de from "./de";
import fr from "./fr";

export * from "./types";

/**
 * The single source of truth for the legal documents.
 *
 * Both the public pages (/terms-of-service, /privacy-policy) and the
 * /api/legal endpoint the mobile app reads render from here, so the wording
 * cannot drift between web and app: edit the language file, and every surface
 * changes with it.
 */
const CATALOG: Record<LegalLanguage, LegalCatalogEntry> = { en, es, de, fr };

/** Average adult reading speed, rounded up to whole minutes. */
const WORDS_PER_MINUTE = 200;

function readMinutes(doc: LegalDocument): number {
  const words = doc.sections
    .flatMap((s) => [s.title, s.body, ...s.points])
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/**
 * Resolve whatever the client sent to a language we ship.
 *
 * Accepts "es", "ES", "es-ES" and the app's own "ES" raw value alike, and
 * falls back to the source language for anything else.
 */
export function normalizeLanguage(
  requested: string | null | undefined,
): LegalLanguage {
  if (!requested) return SOURCE_LANGUAGE;
  const base = requested.trim().toLowerCase().split(/[-_]/)[0];
  return (LANGUAGES as string[]).includes(base)
    ? (base as LegalLanguage)
    : SOURCE_LANGUAGE;
}

/**
 * One document in one language.
 *
 * @param id - "terms" or "privacy"
 * @param language - anything the client sent; normalised here
 */
export function getLegalDocument(
  id: LegalDocumentId,
  language?: string | null,
): LegalDocument {
  const resolved = normalizeLanguage(language);
  return {
    id,
    ...DOCUMENT_META[id],
    ...CATALOG[resolved].documents[id],
  };
}

/** Whether the given language's text has been through legal review. */
export function isReviewed(language?: string | null): boolean {
  return CATALOG[normalizeLanguage(language)].reviewed;
}

const DOCUMENT_ORDER: LegalDocumentId[] = ["terms", "privacy"];

/**
 * Every document in one language, plus the metadata a client needs to present
 * it honestly.
 */
export function getLegalDocuments(requestedLanguage?: string | null) {
  const language = normalizeLanguage(requestedLanguage);
  const reviewed = CATALOG[language].reviewed;

  const documents = DOCUMENT_ORDER.map((id) => {
    const doc = getLegalDocument(id, language);
    return {
      ...doc,
      readMinutes: readMinutes(doc),
      sectionCount: doc.sections.length,
    };
  });

  return {
    /** The language served. Always one we ship; unknown requests become English. */
    language,
    /** True when `language` is the reviewed, legally binding original. */
    isSourceLanguage: language === SOURCE_LANGUAGE,
    /**
     * False when this translation has not been through legal review. Clients
     * showing an unreviewed translation must tell the reader that the English
     * version at https://pennysave.ai/terms-of-service governs.
     */
    reviewed,
    /** The language whose text is binding, whatever `language` is. */
    sourceLanguage: SOURCE_LANGUAGE,
    /** Every language this endpoint can serve. */
    availableLanguages: LANGUAGES,
    documents,
  };
}
