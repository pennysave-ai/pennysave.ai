import type { SubscriptionPeriod } from "@/lib/appStorePrice";
import type en from "./copy/en";

export type Lang = "en" | "de" | "fr" | "es";
export type Copy = typeof en;

/**
 * One language's landing copy. Each language is its own chunk, so a visitor
 * downloads only the copy they read (and another only if they switch).
 */
const COPY_LOADERS: Record<Lang, () => Promise<{ default: Copy }>> = {
  en: () => import("./copy/en"),
  de: () => import("./copy/de"),
  fr: () => import("./copy/fr"),
  es: () => import("./copy/es"),
};

export const loadCopy = (lang: Lang): Promise<Copy> =>
  COPY_LOADERS[lang]().then((m) => m.default);

export const LANGS: { code: Lang; name: string }[] = [
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
];

export const LOCALE: Record<Lang, string> = {
  en: "en-IE",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
};

/** App Store territory whose Premium price is shown for each language. */
export const STORE_TERRITORY: Record<Lang, string> = {
  en: "USA",
  de: "DEU",
  fr: "FRA",
  es: "ESP",
};

/** Suffix after the Premium price, keyed by App Store subscription period. */
export const PRICE_PERIOD: Record<Lang, Record<SubscriptionPeriod, string>> = {
  en: {
    ONE_WEEK: "/ week",
    ONE_MONTH: "/ month",
    TWO_MONTHS: "/ 2 months",
    THREE_MONTHS: "/ 3 months",
    SIX_MONTHS: "/ 6 months",
    ONE_YEAR: "/ year",
  },
  de: {
    ONE_WEEK: "/ Woche",
    ONE_MONTH: "/ Monat",
    TWO_MONTHS: "/ 2 Monate",
    THREE_MONTHS: "/ 3 Monate",
    SIX_MONTHS: "/ 6 Monate",
    ONE_YEAR: "/ Jahr",
  },
  fr: {
    ONE_WEEK: "/ semaine",
    ONE_MONTH: "/ mois",
    TWO_MONTHS: "/ 2 mois",
    THREE_MONTHS: "/ 3 mois",
    SIX_MONTHS: "/ 6 mois",
    ONE_YEAR: "/ an",
  },
  es: {
    ONE_WEEK: "/ semana",
    ONE_MONTH: "/ mes",
    TWO_MONTHS: "/ 2 meses",
    THREE_MONTHS: "/ 3 meses",
    SIX_MONTHS: "/ 6 meses",
    ONE_YEAR: "/ año",
  },
};

/** The same periods as screen readers should hear them ("/ month" reads as "slash month"). */
export const PRICE_PERIOD_SPOKEN: Record<
  Lang,
  Record<SubscriptionPeriod, string>
> = {
  en: {
    ONE_WEEK: "per week",
    ONE_MONTH: "per month",
    TWO_MONTHS: "every 2 months",
    THREE_MONTHS: "every 3 months",
    SIX_MONTHS: "every 6 months",
    ONE_YEAR: "per year",
  },
  de: {
    ONE_WEEK: "pro Woche",
    ONE_MONTH: "pro Monat",
    TWO_MONTHS: "alle 2 Monate",
    THREE_MONTHS: "alle 3 Monate",
    SIX_MONTHS: "alle 6 Monate",
    ONE_YEAR: "pro Jahr",
  },
  fr: {
    ONE_WEEK: "par semaine",
    ONE_MONTH: "par mois",
    TWO_MONTHS: "tous les 2 mois",
    THREE_MONTHS: "tous les 3 mois",
    SIX_MONTHS: "tous les 6 mois",
    ONE_YEAR: "par an",
  },
  es: {
    ONE_WEEK: "por semana",
    ONE_MONTH: "al mes",
    TWO_MONTHS: "cada 2 meses",
    THREE_MONTHS: "cada 3 meses",
    SIX_MONTHS: "cada 6 meses",
    ONE_YEAR: "al año",
  },
};

/** Cookie (and localStorage key) holding the visitor's chosen language. */
export const LANG_COOKIE = "pennysave-landing-lang";

/** Labels around the legal documents; the documents themselves live in `@/data/legal`. */
export const LEGAL_COPY: Record<
  Lang,
  {
    eyebrow: string;
    tabs: string;
    effective: string;
    minRead: string;
    sections: string;
    plain: string;
    plainNote: string;
    questions: string;
    unreviewed: string;
    readEnglish: string;
  }
> = {
  en: {
    eyebrow: "LEGAL",
    tabs: "Legal documents",
    effective: "Effective",
    minRead: "min read",
    sections: "sections",
    plain: "IN PLAIN ENGLISH",
    plainNote:
      "A summary, not the agreement. The full text below is what binds.",
    questions: "Questions about this? Write to",
    unreviewed: "",
    readEnglish: "",
  },
  de: {
    eyebrow: "RECHTLICHES",
    tabs: "Rechtliche Dokumente",
    effective: "Gültig ab",
    minRead: "Min. Lesezeit",
    sections: "Abschnitte",
    plain: "EINFACH ERKLÄRT",
    plainNote:
      "Eine Zusammenfassung, nicht die Vereinbarung. Verbindlich ist der vollständige Text unten.",
    questions: "Fragen dazu? Schreib an",
    unreviewed:
      "Diese Übersetzung wurde noch nicht rechtlich geprüft. Verbindlich ist die englische Fassung.",
    readEnglish: "Auf Englisch lesen",
  },
  fr: {
    eyebrow: "MENTIONS LÉGALES",
    tabs: "Documents juridiques",
    effective: "En vigueur le",
    minRead: "min de lecture",
    sections: "sections",
    plain: "EN BREF",
    plainNote:
      "Un résumé, pas l’accord. Seul le texte complet ci-dessous fait foi.",
    questions: "Une question ? Écrivez à",
    unreviewed:
      "Cette traduction n’a pas encore été vérifiée juridiquement. Seule la version anglaise fait foi.",
    readEnglish: "Lire en anglais",
  },
  es: {
    eyebrow: "LEGAL",
    tabs: "Documentos legales",
    effective: "Vigente desde",
    minRead: "min de lectura",
    sections: "secciones",
    plain: "EN POCAS PALABRAS",
    plainNote:
      "Un resumen, no el acuerdo. Lo que vincula es el texto completo de abajo.",
    questions: "¿Preguntas? Escribe a",
    unreviewed:
      "Esta traducción aún no ha pasado una revisión legal. La versión en inglés es la vinculante.",
    readEnglish: "Leer en inglés",
  },
};
