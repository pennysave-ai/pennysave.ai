import NextLink from "next/link";
import {
  formatEffectiveDate,
  linkify,
} from "@/components/common/legal-document-content";
import { getLegalDocuments, type LegalDocumentId } from "@/data/legal";
import { LEGAL_COPY, LOCALE, type Copy, type Lang } from "./i18n";
import { SiteFooter, SiteHeader } from "./site-chrome";
import { EYEBROW, PAGE } from "./styles";
import { SwitchLanguageButton } from "./language-switcher";

const TAB_HREF: Record<LegalDocumentId, string> = {
  terms: "/terms-of-service",
  privacy: "/privacy-policy",
};

const LINK = "text-orchid transition-colors hover:text-rose";

const Dot = () => (
  <span className="size-[3px] flex-none rounded-full bg-numeral" />
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
export default function LegalPage({
  id,
  lang,
  t,
}: {
  id: LegalDocumentId;
  lang: Lang;
  t: Copy;
}) {
  const docs = getLegalDocuments(lang);
  const { documents, reviewed } = docs;
  const doc = documents.find((d) => d.id === id)!;
  const links = doc.links ?? [];
  const l = LEGAL_COPY[lang];

  return (
    <div lang={lang} className={PAGE}>
      <SiteHeader t={t} lang={lang} />

      <main id="main" className="relative px-6 pt-16 pb-[104px]">
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
                className={`flex min-h-11 items-center rounded-full px-5 text-[13.5px] transition-colors ${
                  d.id === id
                    ? "bg-white/20 text-white shadow-[0_2px_10px_rgba(0,0,0,.3),inset_0_1px_0_rgba(255,255,255,.4)]"
                    : "text-ink-faint hover:text-white"
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
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-faint">
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
              className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[20px] border border-notice/35 bg-notice/8 px-5 py-4"
            >
              <p className="min-w-[220px] flex-1 text-[13.5px] leading-[1.6] text-notice-ink">
                {l.unreviewed}
              </p>
              <SwitchLanguageButton
                to="en"
                className="h-11 cursor-pointer rounded-full border border-white/20 bg-white/8 px-5 text-[13px] whitespace-nowrap text-white transition-colors hover:bg-white/14"
              >
                {l.readEnglish}
              </SwitchLanguageButton>
            </div>
          )}

          <div className="flex flex-col gap-2.5 rounded-3xl border border-orchid/30 bg-orchid/10 p-6">
            <span className="text-xs font-medium tracking-[.16em] text-ink-quiet">
              {l.plain}
            </span>
            <p className="text-lg leading-[1.6] text-pretty">{doc.summary}</p>
            <span className="text-xs leading-[1.6] text-ink-quiet">
              {l.plainNote}
            </span>
          </div>

          <ol className="flex flex-col gap-3">
            {doc.sections.map((section, i) => (
              <li
                key={section.title}
                className="flex gap-4 rounded-[20px] border border-card-edge bg-white/[.035] p-5 sm:p-6"
              >
                <span className="w-6 flex-none pt-[3px] text-xs text-ink-faint tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  <h2 className="text-lg font-medium text-ink-strong">
                    {section.title}
                  </h2>
                  {section.body && (
                    <p className="text-[15px] leading-[1.75] text-pretty text-ink-muted">
                      {linkify(section.body, links, LINK)}
                    </p>
                  )}
                  {section.points.length > 0 && (
                    <ul className="flex flex-col gap-2">
                      {section.points.map((point) => (
                        <li key={point} className="flex items-start gap-2.5">
                          <span className="mt-[11px] size-1 flex-none rounded-full bg-orchid" />
                          <span className="flex-1 text-[15px] leading-[1.7] text-pretty text-ink-muted">
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

          <p className="pt-2 text-center text-[13px] text-ink-faint">
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
