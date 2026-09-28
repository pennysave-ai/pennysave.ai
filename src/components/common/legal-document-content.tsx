import { Fragment, type ReactNode } from "react";
import type { LegalDocument, LegalLink } from "@/data/legal";

// Both stop short of a trailing period, so sentence punctuation stays outside the link.
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.source;
const URL = /https?:\/\/[^\s,)]+[^\s,.)]/.source;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Turn the plain strings of a document into text with the links the published
 * pages have always had.
 *
 * Email addresses and absolute URLs are found automatically, so the document
 * data stays plain text — the same text the mobile app renders. Anything else
 * that should be a link (the cross-reference to the Privacy Policy, say) comes
 * from the document's own `links`, which are per language because the phrase
 * itself is translated.
 */
export function linkify(
  text: string,
  links: LegalLink[],
  linkClassName = "text-primary",
): ReactNode {
  if (!text) return null;

  const phrases = links.map((l) => escapeRegExp(l.phrase));
  const pattern = new RegExp(
    [EMAIL, URL, ...phrases].filter(Boolean).join("|"),
    "g",
  );

  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const [found] = match;
    if (match.index > last) out.push(text.slice(last, match.index));

    const phraseLink = links.find((l) => l.phrase === found);
    const href = phraseLink
      ? phraseLink.href
      : found.includes("@")
        ? `mailto:${found}`
        : found;

    out.push(
      <a
        key={`${match.index}-${found}`}
        className={linkClassName}
        href={href}
        {...(href.startsWith("http") ? { target: "_blank" } : {})}
      >
        {found}
      </a>,
    );
    last = match.index + found.length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * "2025-05-01" -> "May 1, 2025", matching how the pages have always printed it.
 *
 * Parsed as UTC so the date never slips a day for readers west of Greenwich.
 */
export function formatEffectiveDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Renders a legal document from the shared source in `@/data/legal`, so the
 * web pages and the mobile app always show the same words.
 */
export default function LegalDocumentContent({
  document,
}: {
  document: LegalDocument;
}) {
  const links = document.links ?? [];

  return (
    <>
      {document.sections.map((section) => (
        <Fragment key={section.title}>
          <div className="font-medium text-lg mt-4">{section.title}</div>
          {section.body && <div>{linkify(section.body, links)}</div>}
          {section.points.length > 0 && (
            <ul style={{ listStyleType: "disc", marginLeft: "1.5rem" }}>
              {section.points.map((point) => (
                <li key={point}>{linkify(point, links)}</li>
              ))}
            </ul>
          )}
        </Fragment>
      ))}
    </>
  );
}
