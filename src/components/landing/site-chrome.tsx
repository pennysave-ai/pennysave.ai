// Server-safe: shared styles and the header/footer of the marketing pages.
// The one interactive piece, the language switcher, is its own client island.
import type { ReactNode } from "react";
import Image from "next/image";
import NextLink from "next/link";
import logo from "@/app/public/pennysave_logo.png";
import type { Copy, Lang } from "./i18n";
import { LanguageSwitcher } from "./language-switcher";
import { PRIMARY_BUTTON_FLAT } from "./styles";
import { InstagramIcon, TikTokIcon } from "./icons";

export const APP_STORE_URL =
  "https://apps.apple.com/app/apple-store/id6754218614?pt=125612247&ct=Landing%20Site&mt=8";

/** Add more networks here; the footer and the landing page pick them up. */
export const SOCIAL_LINKS = [
  {
    name: "Instagram",
    handle: "@pennysave.ai",
    href: "https://www.instagram.com/pennysave.ai",
    Icon: InstagramIcon,
  },
  {
    name: "TikTok",
    handle: "@pennysave.ai",
    href: "https://www.tiktok.com/@pennysave.ai",
    Icon: TikTokIcon,
  },
];

const FOOTER_LINK = "text-ink-muted transition-colors hover:text-white";

/** Every download button: opens the App Store listing in a new tab and says so. */
export function StoreLink({
  t,
  className,
  children,
}: {
  t: Copy;
  className: string;
  children: ReactNode;
}) {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
      <span className="sr-only"> {t.nav.opensStore}</span>
    </a>
  );
}

/** "PennySave.ai" with the ".ai" in the accent colour. */
export function Wordmark() {
  return (
    <>
      PennySave<span className="text-orchid">.ai</span>
    </>
  );
}

/**
 * Sticky site header with the language switcher. On the home page (`onHome`)
 * the nav links scroll to sections on the same page; elsewhere they link back
 * to those sections on the home page.
 */
export function SiteHeader({
  t,
  lang,
  onHome = false,
}: {
  t: Copy;
  lang: Lang;
  onHome?: boolean;
}) {
  const home = onHome ? "" : "/";

  return (
    <>
      <a
        href="#main"
        className="fixed top-3 left-3 z-30 -translate-y-20 rounded-full bg-white px-5 py-3 text-sm font-medium text-card transition-transform focus:translate-y-0"
      >
        {t.nav.skip}
      </a>
      <header className="sticky top-0 z-20 border-b border-white/7 bg-midnight/72 backdrop-blur-[18px]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-6 px-6 py-3.5">
          <NextLink
            href={onHome ? "#top" : "/"}
            className="flex items-center gap-2.5 text-white"
          >
            <Image
              src={logo}
              alt="PennySave.ai"
              width={34}
              height={34}
              className="rounded-[10px]"
              priority
            />
            <span className="hidden text-lg font-medium tracking-[-.01em] sm:inline">
              <Wordmark />
            </span>
          </NextLink>
          <nav className="hidden flex-1 flex-wrap gap-[26px] text-sm lg:flex">
            {(
              [
                ["#problem", t.nav.why],
                ["#plan", t.nav.how],
                ["#pricing", t.nav.plans],
              ] as const
            ).map(([hash, label]) => (
              <NextLink
                key={hash}
                href={`${home}${hash}`}
                className="text-ink-muted transition-colors hover:text-white"
              >
                {label}
              </NextLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitcher lang={lang} label={t.nav.language} />
            <StoreLink
              t={t}
              className={`h-11 px-5 text-sm whitespace-nowrap shadow-[0_6px_22px_rgba(225,85,224,.35)] ${PRIMARY_BUTTON_FLAT}`}
            >
              {t.nav.getApp}
            </StoreLink>
          </div>
        </div>
      </header>
    </>
  );
}

export function SiteFooter({ t }: { t: Copy }) {
  return (
    <footer className="border-t border-white/7 px-6 py-8">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-6 text-[13px] text-ink-faint">
        <span className="flex-1">
          © {new Date().getFullYear()} PennySave.ai
        </span>
        <NextLink href="/terms-of-service" className={FOOTER_LINK}>
          {t.foot.terms}
        </NextLink>
        <NextLink href="/privacy-policy" className={FOOTER_LINK}>
          {t.foot.privacy}
        </NextLink>
        <a href="mailto:support@pennysave.ai" className={FOOTER_LINK}>
          support@pennysave.ai
        </a>
        <div className="flex items-center gap-2">
          {SOCIAL_LINKS.map(({ name, href, Icon }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
              title={name}
              className="flex size-11 items-center justify-center rounded-full border border-white/12 text-ink-muted transition-colors hover:border-white/30 hover:text-white"
            >
              <Icon width={18} height={18} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
