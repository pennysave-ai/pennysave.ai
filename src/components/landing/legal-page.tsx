"use client";

import NextLink from "next/link";
import {
  formatEffectiveDate,
  linkify,
} from "@/components/common/legal-document-content";
import { getLegalDocuments, type LegalDocumentId } from "@/data/legal";
import { I18N, LEGAL_COPY, LOCALE, type Lang } from "./i18n";
import {
  EYEBROW,
  PAGE,
  SiteFooter,
  SiteHeader,
  setLang,
  useLanguage,
} from "./site-chrome";

const TAB_HREF: Record<LegalDocumentId, string> = {
  terms: "/terms-of-service",
  privacy: "/privacy-policy",
};

const LINK = "text-[#E155E0] transition-colors hover:text-[#E4829B]";

const Dot = () => (
  <span className="size-[3px] flex-none rounded-full bg-[#4E4E63]" />
);

function effectiveDate(isoDate: string, lang: Lang) {
  if (lang === "en") return formatEffectiveDate(isoDate);
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString(LOCALE[lang], {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * A legal document in the site's design, after the app's legal screen: plain
 * summary first, then every section as a numbered card.
 *
 * Follows the site language. Translations that have not been through legal
 * review say so and point back to the English text, which governs.
 */
export default function LegalPage({ id }: { id: LegalDocumentId }) {
  const lang = useLanguage();
  const { documents, reviewed } = getLegalDocuments(lang);
  const doc = documents.find((d) => d.id === id)!;
  const links = doc.links ?? [];
  const t = I18N[lang];
  const l = LEGAL_COPY[lang];

  return (
    <div className={PAGE}>
      <SiteHeader t={t} lang={lang} />

      <main className="relative px-6 pt-16 pb-[104px]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_70%_at_80%_0%,rgba(225,85,224,.16),transparent_70%),radial-gradient(45%_60%_at_0%_20%,rgba(174,102,232,.12),transparent_70%)]" />

        <div className="relative mx-auto flex max-w-[760px] flex-col gap-6">
          <nav
            aria-label={l.tabs}
            className="flex gap-[3px] self-start rounded-full border border-white/20 bg-white/7 p-[3px]"
          >
            {documents.map((d) => (
              <NextLink
                key={d.id}
                href={TAB_HREF[d.id]}
                aria-current={d.id === id ? "page" : undefined}
                className={`rounded-full px-5 py-2 text-[13.5px] transition-colors ${
                  d.id === id
                    ? "bg-white/20 text-white shadow-[0_2px_10px_rgba(0,0,0,.3),inset_0_1px_0_rgba(255,255,255,.4)]"
                    : "text-[#7E7E8F] hover:text-white"
                }`}
              >
                {d.label}
              </NextLink>
            ))}
          </nav>

          <div className="flex flex-col gap-4 pt-4">
            <span className={EYEBROW}>{l.eyebrow}</span>
            <h1 className="text-[clamp(36px,5vw,56px)] leading-[1.08] font-medium tracking-[-.035em] text-balance">
              {doc.label}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#7E7E8F]">
              <span>
                {l.effective} {effectiveDate(doc.effectiveDate, lang)}
              </span>
              <Dot />
              <span>
                {doc.readMinutes} {l.minRead}
              </span>
              <Dot />
              <span>
                {doc.sectionCount} {l.sections}
              </span>
            </div>
          </div>

          {!reviewed && (
            <div
              role="note"
              className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[20px] border border-[rgba(240,196,100,.35)] bg-[rgba(240,196,100,.08)] px-5 py-4"
            >
              <p className="min-w-[220px] flex-1 text-[13.5px] leading-[1.6] text-[#EDE3C8]">
                {l.unreviewed}
              </p>
              <button
                type="button"
                onClick={() => setLang("en")}
                className="h-9 cursor-pointer rounded-full border border-white/20 bg-white/8 px-4 text-[13px] whitespace-nowrap text-white transition-colors hover:bg-white/14"
              >
                {l.readEnglish}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2.5 rounded-3xl border border-[rgba(225,85,224,.3)] bg-[rgba(225,85,224,.1)] p-6">
            <span className="text-[10.5px] font-medium tracking-[.14em] text-[#9A9AB2]">
              {l.plain}
            </span>
            <p className="text-[17px] leading-[1.6] text-pretty">
              {doc.summary}
            </p>
            <span className="text-xs leading-[1.6] text-[#9A9AB2]">
              {l.plainNote}
            </span>
          </div>

          <ol className="flex flex-col gap-3">
            {doc.sections.map((section, i) => (
              <li
                key={section.title}
                className="flex gap-4 rounded-[20px] border border-[#363650] bg-white/[.035] p-5 sm:p-6"
              >
                <span className="w-6 flex-none pt-[3px] text-xs text-[#5F5F72] tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  <h2 className="text-[17px] font-medium text-[#E6E6F0]">
                    {section.title}
                  </h2>
                  {section.body && (
                    <p className="text-[15px] leading-[1.75] text-pretty text-[#B9B9CC]">
                      {linkify(section.body, links, LINK)}
                    </p>
                  )}
                  {section.points.length > 0 && (
                    <ul className="flex flex-col gap-2">
                      {section.points.map((point) => (
                        <li key={point} className="flex items-start gap-2.5">
                          <span className="mt-[11px] size-1 flex-none rounded-full bg-[#E155E0]" />
                          <span className="flex-1 text-[15px] leading-[1.7] text-pretty text-[#B9B9CC]">
                            {linkify(point, links, LINK)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <p className="pt-2 text-center text-[13px] text-[#6E6E85]">
            {l.questions}{" "}
            <a href="mailto:support@pennysave.ai" className={LINK}>
              support@pennysave.ai
            </a>
          </p>
        </div>
      </main>

      <SiteFooter t={t} />
    </div>
  );
}
