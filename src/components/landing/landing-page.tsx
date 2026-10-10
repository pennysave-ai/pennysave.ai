import type { ReactNode } from "react";
import Image from "next/image";
import logo from "@/app/public/pennysave_logo.png";
import type { StorePrices } from "@/lib/appStorePrice";
import {
  LOCALE,
  PRICE_PERIOD,
  PRICE_PERIOD_SPOKEN,
  STORE_TERRITORY,
  type Copy,
  type Lang,
} from "./i18n";
import { mockData } from "./mock-data";
import { AddMockup, PhoneMockup, SeeMockup, ShareMockup } from "./mockups";
import { CommunitySection } from "./community";
import { StakesToggle } from "./stakes-toggle";
import {
  CheckIcon,
  CurrencyIcon,
  ReceiptIcon,
  ReportIcon,
  TeamIcon,
} from "./icons";
import { SiteFooter, SiteHeader, StoreLink } from "./site-chrome";
import {
  CARD,
  EYEBROW,
  GHOST_BUTTON,
  GRADIENT_TEXT,
  PAGE,
  PRIMARY_BUTTON,
  PRIMARY_BUTTON_FLAT,
} from "./styles";

const H2 =
  "text-[clamp(32px,4.4vw,52px)] leading-[1.1] font-medium tracking-[-.03em] text-balance";
const LEAD = "text-lg leading-[1.7] text-pretty text-ink-lead";
const PREMIUM_BADGE =
  "flex h-5 items-center rounded-full bg-orchid/18 px-2 text-[10.5px] font-normal text-orchid-mist";

// Order matches t.guide.cards; the first three are Premium features.
const GUIDE_ICONS = [ReceiptIcon, ReportIcon, TeamIcon, CurrencyIcon];

/**
 * The landing page, rendered on the server in the visitor's language. Only the
 * language switcher, the Stakes toggle and the feature-request form run in the
 * browser.
 */
export default function LandingPage({
  prices,
  lang,
  t,
  territory,
}: {
  prices: StorePrices;
  lang: Lang;
  t: Copy;
  /** The visitor's App Store territory, when the server could tell. */
  territory: string | null;
}) {
  // Price follows the visitor's country; without one, the language's store.
  const premiumPrice = prices[territory ?? STORE_TERRITORY[lang]];
  const periodLabel = premiumPrice && PRICE_PERIOD[lang][premiumPrice.period];
  const currency = premiumPrice?.currency ?? (lang === "en" ? "USD" : "EUR");
  const m = mockData(lang, t, currency);

  return (
    // The content carries its language from the server; the switcher keeps
    // <html lang> in step after hydration.
    <div lang={lang} className={PAGE}>
      <SiteHeader t={t} lang={lang} onHome />

      <main id="main">
        {/* Hero */}
        <section id="top" className="relative px-6 pt-[72px] pb-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_20%,rgba(225,85,224,.28),transparent_70%),radial-gradient(50%_50%_at_10%_60%,rgba(174,102,232,.18),transparent_70%)]" />
          <div className="relative mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-14">
            <div className="flex flex-col gap-[26px]">
              <span className="flex min-h-[30px] items-center gap-2 self-start rounded-full border border-white/18 bg-white/6 px-3.5 py-1 text-[12.5px] text-ink-label">
                <span className="size-[7px] flex-none rounded-full bg-mint" />
                {t.hero.badge}
              </span>
              <h1 className="text-[clamp(40px,6vw,68px)] leading-[1.04] font-medium tracking-[-.035em] text-balance">
                {t.hero.h1a} <span className={GRADIENT_TEXT}>{t.hero.h1b}</span>
              </h1>
              <p className="max-w-[540px] text-lg leading-[1.65] text-pretty text-ink-lead">
                {t.hero.sub}
              </p>
              <div className="flex flex-wrap gap-3">
                <StoreLink
                  t={t}
                  className={`h-[54px] px-7 text-base ${PRIMARY_BUTTON}`}
                >
                  {t.hero.start}
                </StoreLink>
                <a
                  href="#plan"
                  className={`h-[54px] px-6 text-base ${GHOST_BUTTON}`}
                >
                  {t.hero.how}
                </a>
              </div>
              <span className="text-[13px] text-ink-quiet">{t.hero.meta}</span>
            </div>
            <PhoneMockup t={t} m={m} />
          </div>
        </section>

        {/* Problem: three plain statements, not cards */}
        <section
          id="problem"
          className="scroll-mt-20 border-t border-white/6 bg-night px-6 py-24"
        >
          <div className="mx-auto flex max-w-[1200px] flex-col gap-14">
            <div className="flex max-w-[760px] flex-col gap-4">
              <span className={EYEBROW}>{t.problem.eyebrow}</span>
              <h2 className={H2}>{t.problem.title}</h2>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-x-12 gap-y-10">
              {t.problem.items.map((p) => (
                <div
                  key={p.h}
                  className="flex flex-col gap-3 border-t border-white/12 pt-6"
                >
                  <h3 className="text-[22px] leading-[1.3] font-medium text-balance">
                    {p.h}
                  </h3>
                  <p className="text-[15px] leading-[1.7] text-pretty text-ink-muted">
                    {p.p}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Guide */}
        <section className="relative px-6 py-[104px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_0%_50%,rgba(174,102,232,.16),transparent_70%)]" />
          <div className="relative mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-14">
            <div className="flex flex-col gap-5">
              <span className={EYEBROW}>{t.guide.eyebrow}</span>
              <h2 className={H2}>{t.guide.title}</h2>
              <p className={`max-w-[540px] ${LEAD}`}>{t.guide.body}</p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-3.5">
              {t.guide.cards.map(([h, p], i) => {
                const Icon = GUIDE_ICONS[i];
                return (
                  <div
                    key={h}
                    className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/4 p-[22px]"
                  >
                    {Icon && <Icon className="text-white" />}
                    <h3 className="flex flex-wrap items-center gap-2 text-base font-medium">
                      {h}
                      {i < 3 && <span className={PREMIUM_BADGE}>Premium</span>}
                    </h3>
                    <p className="text-[13.5px] leading-[1.6] text-pretty text-ink-muted">
                      {p}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Plan */}
        <section
          id="plan"
          className="scroll-mt-20 border-y border-white/6 bg-night px-6 py-[104px]"
        >
          <div className="mx-auto flex max-w-[1200px] flex-col gap-[52px]">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className={EYEBROW}>{t.plan.eyebrow}</span>
              <h2 className={`max-w-[780px] ${H2}`}>{t.plan.title}</h2>
            </div>
            <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5">
              <StepCard
                glow="rgba(225,85,224,.22)"
                visual={<AddMockup t={t} m={m} />}
                step={`${t.plan.step} 1`}
                title={t.plan.s1h}
                body={t.plan.s1p}
              />
              <StepCard
                glow="rgba(174,102,232,.22)"
                visual={<SeeMockup t={t} m={m} />}
                step={`${t.plan.step} 2`}
                title={t.plan.s2h}
                body={t.plan.s2p}
              />
              <StepCard
                glow="rgba(228,130,155,.22)"
                visual={<ShareMockup t={t} m={m} />}
                step={`${t.plan.step} 3`}
                title={t.plan.s3h}
                body={t.plan.s3p}
                premium
              />
            </ol>
            <div className="flex justify-center">
              <StoreLink
                t={t}
                className={`h-[54px] px-7 text-base ${PRIMARY_BUTTON}`}
              >
                {t.hero.start}
              </StoreLink>
            </div>
          </div>
        </section>

        {/* Stakes: opens on the calm side; the other side is one tap away */}
        <section className="px-6 py-[104px]">
          <div className="mx-auto flex max-w-[960px] flex-col items-center gap-9">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className={EYEBROW}>{t.stakes.eyebrow}</span>
              <h2 className={H2}>{t.stakes.title}</h2>
            </div>
            <StakesToggle stakes={t.stakes} />
          </div>
        </section>

        {/* Pricing: two plans, one download (the trial starts in the app) */}
        <section
          id="pricing"
          className="scroll-mt-20 border-t border-white/6 bg-night px-6 py-[104px]"
        >
          <div className="mx-auto flex max-w-[960px] flex-col gap-11">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className={EYEBROW}>{t.pricing.eyebrow}</span>
              <h2 className={H2}>{t.pricing.title}</h2>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-5">
              <div
                className={`flex flex-col gap-[22px] rounded-[32px] p-[34px] ${CARD}`}
              >
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-4xl font-medium tracking-[-.03em]">
                    {t.pricing.free}
                  </h3>
                  <span className="text-[13.5px] text-ink-quiet">
                    {t.pricing.freeSub}
                  </span>
                </div>
                <FeatureList
                  items={t.pricing.freeList}
                  checkClassName="text-mint"
                />
              </div>
              <div className="relative flex flex-col gap-[22px] rounded-[32px] border border-orchid-mist bg-[linear-gradient(180deg,rgba(225,85,224,.14),rgba(21,21,51,1)_60%)] p-[34px] shadow-[0_10px_50px_rgba(225,85,224,.25)]">
                <span className="absolute -top-[13px] right-7 flex h-[26px] items-center rounded-full bg-orchid px-3 text-xs font-medium text-white">
                  {t.pricing.badge}
                </span>
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-4xl font-medium tracking-[-.03em]">
                      Premium
                    </h3>
                    {premiumPrice && periodLabel && (
                      <span className="text-[13.5px] text-ink-quiet">
                        <span className="text-2xl font-medium tracking-[-.02em] text-white">
                          {new Intl.NumberFormat(LOCALE[lang], {
                            style: "currency",
                            currency: premiumPrice.currency,
                            // "$4.99", not en-IE's "US$4.99"
                            currencyDisplay: "narrowSymbol",
                          }).format(Number(premiumPrice.amount))}
                        </span>{" "}
                        <span aria-hidden>{periodLabel}</span>
                        <span className="sr-only">
                          {PRICE_PERIOD_SPOKEN[lang][premiumPrice.period]}
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="text-[13.5px] text-ink-quiet">
                    {t.pricing.premiumSub}
                  </span>
                </div>
                <FeatureList
                  items={t.pricing.premiumList}
                  checkClassName="text-orchid"
                />
                <span className="mt-auto text-xs leading-normal text-pretty text-ink-quiet">
                  {t.pricing.note}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-5">
              <StoreLink
                t={t}
                className={`h-14 justify-center px-8 text-center text-base ${PRIMARY_BUTTON_FLAT}`}
              >
                {t.pricing.cta}
              </StoreLink>
              <TrustRow items={t.pricing.trust} />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-[104px]">
          <div
            className={`relative mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-center overflow-hidden rounded-[40px] ${CARD}`}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_90%_at_100%_50%,rgba(225,85,224,.16),transparent_70%)]" />
            <div className="relative flex flex-col items-start gap-6 p-[clamp(36px,6vw,72px)]">
              <h2 className="text-[clamp(34px,4.6vw,56px)] leading-[1.08] font-medium tracking-[-.035em] text-balance">
                {t.final.title}
              </h2>
              <p className={`max-w-[480px] ${LEAD}`}>{t.final.body}</p>
              <StoreLink
                t={t}
                className={`min-h-14 px-[30px] text-base ${PRIMARY_BUTTON}`}
              >
                {t.final.cta}
              </StoreLink>
            </div>
            <div className="relative flex min-h-[340px] items-center justify-center p-10">
              <div className="absolute size-[min(420px,88vw)] rounded-full border border-white/10 motion-safe:animate-ripple" />
              <div className="absolute size-[min(420px,88vw)] rounded-full border border-white/10 motion-safe:animate-ripple motion-safe:[animation-delay:-2s]" />
              <div className="absolute size-[min(420px,88vw)] rounded-full border border-white/10 motion-safe:animate-ripple motion-safe:[animation-delay:-4s]" />
              <Image
                src={logo}
                alt="PennySave.ai"
                width={180}
                height={180}
                className="relative rounded-[44px] border border-white/12 shadow-[0_30px_70px_rgba(0,0,0,.55),0_0_80px_rgba(225,85,224,.25)]"
              />
            </div>
          </div>
        </section>

        {/* Roadmap: an epilogue after the close, so it never stands between
            the visitor and the download */}
        <section
          id="roadmap"
          className="border-t border-white/6 px-6 py-[104px]"
        >
          <div className="mx-auto flex max-w-[1200px] flex-col gap-11">
            <div className="flex max-w-[760px] flex-col gap-4">
              <span className={EYEBROW}>{t.road.eyebrow}</span>
              <h2 className={H2}>{t.road.title}</h2>
              <p className={LEAD}>{t.road.sub}</p>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-x-12 gap-y-10">
              {t.road.items.map((r) => (
                <li
                  key={r.h}
                  className="flex flex-col gap-3 border-t border-dashed border-white/20 pt-6"
                >
                  <span className="flex h-6 items-center self-start rounded-full border border-white/20 px-2.5 text-[11px] text-ink-label">
                    {t.road.soon}
                  </span>
                  <h3 className="text-[22px] leading-[1.3] font-medium">
                    {r.h}
                  </h3>
                  <p className="text-[15px] leading-[1.7] text-pretty text-ink-muted">
                    {r.p}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <CommunitySection t={t} lang={lang} />
      </main>

      <SiteFooter t={t} />
    </div>
  );
}

function StepCard({
  glow,
  visual,
  step,
  title,
  body,
  premium = false,
}: {
  glow: string;
  visual: ReactNode;
  step: string;
  title: string;
  body: string;
  premium?: boolean;
}) {
  return (
    <li className={`flex flex-col overflow-hidden rounded-[32px] ${CARD}`}>
      <div
        className="flex h-[280px] items-center justify-center p-[22px]"
        style={{
          background: `radial-gradient(80% 80% at 50% 0%, ${glow}, transparent 70%)`,
        }}
      >
        {visual}
      </div>
      <div className="flex flex-col gap-2.5 px-7 pt-[26px] pb-[30px]">
        <span className="text-xs font-medium tracking-[.14em] text-orchid">
          {step}
        </span>
        <h3 className="flex flex-wrap items-center gap-2.5 text-[22px] font-medium">
          {title}
          {premium && <span className={PREMIUM_BADGE}>Premium</span>}
        </h3>
        <p className="text-[15px] leading-[1.7] text-pretty text-ink-muted">
          {body}
        </p>
      </div>
    </li>
  );
}

function FeatureList({
  items,
  checkClassName,
}: {
  items: string[];
  checkClassName: string;
}) {
  return (
    <ul className="flex flex-col gap-3 text-[15px] text-ink-strong">
      {items.map((x) => (
        <li key={x} className="flex gap-2.5">
          <CheckIcon
            width={16}
            height={16}
            className={`mt-[3px] flex-none ${checkClassName}`}
          />
          {x}
        </li>
      ))}
    </ul>
  );
}

/** The three facts a hesitant visitor needs before leaving for the App Store. */
function TrustRow({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-ink-muted">
      {items.map((x) => (
        <li key={x} className="flex items-center gap-2">
          <CheckIcon width={14} height={14} className="flex-none text-mint" />
          {x}
        </li>
      ))}
    </ul>
  );
}
