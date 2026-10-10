"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE, LANGS, type Lang } from "./i18n";

const isLang = (l: string | null): l is Lang => LANGS.some((x) => x.code === l);

function saveLang(l: Lang) {
  try {
    localStorage.setItem(LANG_COOKIE, l);
  } catch {}
  // The server reads this cookie to render the page in the chosen language.
  document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Switch the marketing pages' language: save the choice in the cookie and ask
 * the server for the page again. The pages are server components, so the new
 * language arrives already rendered, with only that language's copy.
 * `pending` is the language being fetched, for a busy state on its control.
 */
function useSwitchLanguage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<Lang | null>(null);

  const switchTo = (l: Lang) => {
    saveLang(l);
    setTarget(l);
    startTransition(() => router.refresh());
  };

  return { switchTo, pending: isPending ? target : null };
}

/** Header language control: four pills, or a native picker on phones. */
export function LanguageSwitcher({
  lang,
  label,
}: {
  lang: Lang;
  label: string;
}) {
  const { switchTo, pending } = useSwitchLanguage();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Visitors who chose a language before the cookie existed only have it in
  // localStorage: move it into the cookie, switching to it if it differs.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(LANG_COOKIE);
    } catch {}
    const hasCookie = document.cookie
      .split("; ")
      .some((c) => c.startsWith(`${LANG_COOKIE}=`));
    if (!isLang(stored) || hasCookie) return;
    if (stored === lang) saveLang(stored);
    else switchTo(stored);
    // Runs once per page load; switchTo is stable enough for that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        role="group"
        aria-label={label}
        className="hidden h-9 gap-0.5 rounded-full border border-white/14 bg-white/5 p-[3px] sm:flex"
      >
        {LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            lang={l.code}
            aria-label={l.name}
            aria-pressed={l.code === lang}
            aria-busy={l.code === pending}
            onClick={() => l.code !== lang && switchTo(l.code)}
            className={`relative h-7 min-w-[38px] cursor-pointer rounded-full px-2.5 text-xs font-medium uppercase transition-colors after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] aria-busy:cursor-progress aria-busy:bg-white/15 aria-busy:text-white motion-safe:aria-busy:animate-pulse ${
              l.code === lang
                ? "bg-white text-card"
                : "bg-transparent text-ink-muted hover:text-white"
            }`}
          >
            {l.code}
          </button>
        ))}
      </div>
      {/* Phones: a native picker instead of four pills, so the header stays one row. */}
      <label className="relative flex h-11 items-center sm:hidden">
        <span className="sr-only">{label}</span>
        <select
          value={pending ?? lang}
          aria-busy={pending !== null}
          onChange={(e) => switchTo(e.target.value as Lang)}
          className="h-11 cursor-pointer appearance-none rounded-full border border-white/14 bg-white/5 pr-7 pl-3.5 text-[13px] font-medium text-white aria-busy:cursor-progress aria-busy:opacity-70"
        >
          {LANGS.map((l) => (
            <option
              key={l.code}
              value={l.code}
              lang={l.code}
              className="bg-card"
            >
              {l.name}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className="pointer-events-none absolute right-3 size-2.5 text-ink-muted"
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </label>
    </>
  );
}

/** A button that switches the page to one language (e.g. "Read in English"). */
export function SwitchLanguageButton({
  to,
  className,
  children,
}: {
  to: Lang;
  className: string;
  children: ReactNode;
}) {
  const { switchTo, pending } = useSwitchLanguage();
  return (
    <button
      type="button"
      aria-busy={pending === to}
      onClick={() => switchTo(to)}
      className={`${className} aria-busy:cursor-progress aria-busy:opacity-70`}
    >
      {children}
    </button>
  );
}
