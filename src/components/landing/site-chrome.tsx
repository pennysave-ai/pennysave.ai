"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import Image from "next/image";
import NextLink from "next/link";
import logo from "@/app/public/pennysave_logo.png";
import { I18N, LANGS, type Copy, type Lang } from "./i18n";

export const APP_STORE_URL =
  "https://apps.apple.com/app/apple-store/id6754218614?pt=125612247&ct=Landing%20Site&mt=8";
const LANG_STORAGE_KEY = "pennysave-landing-lang";

export const GRADIENT = "bg-[linear-gradient(180deg,#E4829B,#E155E0,#AE66E8)]";
export const GRADIENT_TEXT =
  "bg-[linear-gradient(90deg,#E4829B,#E155E0,#AE66E8)] bg-clip-text text-transparent";
export const PRIMARY_BUTTON = `flex items-center rounded-full ${GRADIENT} font-medium text-white shadow-[0_10px_32px_rgba(225,85,224,.4)] transition-opacity hover:opacity-90`;
export const GHOST_BUTTON =
  "flex items-center rounded-full border border-white/22 bg-white/6 text-white transition-colors hover:bg-white/10";
export const EYEBROW = "text-xs font-medium tracking-[.16em] text-[#E4829B]";
export const CARD = "border border-[#2A2A48] bg-[#151533]";
/** Page background shared by every page in the (landing) route group. */
export const PAGE =
  "relative min-h-screen overflow-x-clip bg-[#0E0E24] text-white antialiased";

const FOOTER_LINK = "text-[#B9B9CC] transition-colors hover:text-white";

export function StoreLink({
  className,
  children,
}: {
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
    </a>
  );
}

/** "PennySave.ai" with the ".ai" in the accent colour. */
export function Wordmark() {
  return (
    <>
      PennySave<span className="text-[#E155E0]">.ai</span>
    </>
  );
}

// Language preference: explicit choice > saved choice > browser language > en.
let chosenLang: Lang | null = null;
const langListeners = new Set<() => void>();

function readLang(): Lang {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(LANG_STORAGE_KEY);
  } catch {}
  const browser = navigator.language?.slice(0, 2);
  return (
    chosenLang ??
    [stored, browser].find((l): l is Lang => !!l && l in I18N) ??
    "en"
  );
}

function subscribeLang(listener: () => void) {
  langListeners.add(listener);
  return () => langListeners.delete(listener);
}

export function setLang(l: Lang) {
  chosenLang = l;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, l);
  } catch {}
  langListeners.forEach((listener) => listener());
}

export function useLanguage() {
  const lang = useSyncExternalStore<Lang>(subscribeLang, readLang, () => "en");

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return lang;
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
    <header className="sticky top-0 z-20 border-b border-white/7 bg-[rgba(14,14,36,.72)] backdrop-blur-[18px]">
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
          <span className="text-[17px] font-medium tracking-[-.01em]">
            <Wordmark />
          </span>
        </NextLink>
        <nav className="hidden flex-1 flex-wrap gap-[26px] text-sm md:flex">
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
              className="text-[#B9B9CC] transition-colors hover:text-white"
            >
              {label}
            </NextLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex h-9 gap-0.5 rounded-full border border-white/14 bg-white/5 p-[3px]">
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                title={l.name}
                aria-pressed={l.code === lang}
                onClick={() => setLang(l.code)}
                className={`h-7 min-w-[38px] cursor-pointer rounded-full px-2.5 text-xs font-medium uppercase transition-colors ${
                  l.code === lang
                    ? "bg-white text-[#151533]"
                    : "bg-transparent text-[#B9B9CC] hover:text-white"
                }`}
              >
                {l.code}
              </button>
            ))}
          </div>
          <StoreLink
            className={`h-10 px-[18px] text-sm whitespace-nowrap shadow-[0_6px_22px_rgba(225,85,224,.35)] ${PRIMARY_BUTTON}`}
          >
            {t.nav.getApp}
          </StoreLink>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ t }: { t: Copy }) {
  return (
    <footer className="border-t border-white/7 px-6 py-8">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-6 text-[13px] text-[#8E8EA6]">
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
      </div>
    </footer>
  );
}
