"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import logo from "@/app/public/pennysave_logo.png";
import { I18N } from "./i18n";
import { mockData } from "./mock-data";
import { AddMockup, PhoneMockup, SeeMockup, ShareMockup } from "./mockups";
import { CardIcon, CurrencyIcon, ReportIcon, TeamIcon } from "./icons";
import {
  CARD,
  EYEBROW,
  GHOST_BUTTON,
  GRADIENT_TEXT,
  PAGE,
  PRIMARY_BUTTON,
  SiteFooter,
  SiteHeader,
  StoreLink,
  useLanguage,
} from "./site-chrome";

const H2 =
  "text-[clamp(32px,4.4vw,52px)] leading-[1.1] font-medium tracking-[-.03em] text-balance";
const PREMIUM_BADGE =
  "flex h-5 items-center rounded-full bg-[rgba(225,85,224,.18)] px-2 text-[10.5px] font-normal text-[#F0A8EF]";

const GUIDE_ICONS = [CardIcon, ReportIcon, TeamIcon, CurrencyIcon];

export default function LandingPage() {
  const lang = useLanguage();
  const [withPlan, setWithPlan] = useState(false);
  const t = I18N[lang];
  const m = useMemo(() => mockData(lang, t), [lang, t]);

  return (
    <div className={PAGE}>
      <SiteHeader t={t} lang={lang} onHome />

      <main>
        {/* Hero */}
        <section id="top" className="relative px-6 pt-[72px] pb-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_20%,rgba(225,85,224,.28),transparent_70%),radial-gradient(50%_50%_at_10%_60%,rgba(174,102,232,.18),transparent_70%)]" />
          <div className="relative mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-14">
            <div className="flex flex-col gap-[26px]">
              <span className="flex min-h-[30px] items-center gap-2 self-start rounded-full border border-white/18 bg-white/6 px-3.5 py-1 text-[12.5px] text-[#DCDCEB]">
                <span className="size-[7px] flex-none rounded-full bg-[#4FD1A5]" />
                {t.hero.badge}
              </span>
              <h1 className="text-[clamp(40px,6vw,68px)] leading-[1.04] font-medium tracking-[-.035em] text-balance">
                {t.hero.h1a} <span className={GRADIENT_TEXT}>{t.hero.h1b}</span>
              </h1>
              <p className="max-w-[540px] text-lg leading-[1.65] text-pretty text-[#C9C9DA]">
                {t.hero.sub}
              </p>
              <div className="flex flex-wrap gap-3">
                <StoreLink
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
              <span className="text-[13px] text-[#9A9AAC]">{t.hero.meta}</span>
            </div>
            <PhoneMockup t={t} m={m} />
          </div>
        </section>

        {/* Problem */}
        <section
          id="problem"
          className="scroll-mt-16 border-t border-white/6 bg-[#0B0B1E] px-6 py-24"
        >
          <div className="mx-auto flex max-w-[1200px] flex-col gap-12">
            <div className="flex max-w-[760px] flex-col gap-4">
              <span className={EYEBROW}>{t.problem.eyebrow}</span>
              <h2 className={H2}>{t.problem.title}</h2>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5">
              {t.problem.items.map((p) => (
                <div
                  key={p.n}
                  className={`flex flex-col gap-3.5 rounded-[28px] p-[30px] ${CARD}`}
                >
                  <span className="text-[44px] leading-none font-medium tracking-[-.03em] text-[#3C3C62]">
                    {p.n}
                  </span>
                  <h3 className="text-[21px] leading-[1.3] font-medium text-balance">
                    {p.h}
                  </h3>
                  <p className="text-[15px] leading-[1.7] text-pretty text-[#B9B9CC]">
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
              <p className="max-w-[540px] text-[17px] leading-[1.7] text-pretty text-[#C9C9DA]">
                {t.guide.body}
              </p>
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
                    <span className="flex flex-wrap items-center gap-2 text-base font-medium">
                      {h}
                      {i < 3 && <span className={PREMIUM_BADGE}>Premium</span>}
                    </span>
                    <span className="text-[13.5px] leading-[1.6] text-pretty text-[#B9B9CC]">
                      {p}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Plan */}
        <section
          id="plan"
          className="scroll-mt-16 border-y border-white/6 bg-[#0B0B1E] px-6 py-[104px]"
        >
          <div className="mx-auto flex max-w-[1200px] flex-col gap-[52px]">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className={EYEBROW}>{t.plan.eyebrow}</span>
              <h2 className={`max-w-[780px] ${H2}`}>{t.plan.title}</h2>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5">
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
            </div>
            <div className="flex justify-center">
              <StoreLink
                className={`h-[54px] px-7 text-base ${PRIMARY_BUTTON}`}
              >
                {t.hero.start}
              </StoreLink>
            </div>
          </div>
        </section>

        {/* Stakes */}
        <section className="px-6 py-[104px]">
          <div className="mx-auto flex max-w-[960px] flex-col items-center gap-9">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className={EYEBROW}>{t.stakes.eyebrow}</span>
              <h2 className={H2}>{t.stakes.title}</h2>
            </div>
            <div className="flex gap-1 rounded-full border border-white/12 bg-white/5 p-1">
              {[
                { active: !withPlan, label: t.stakes.without, value: false },
                { active: withPlan, label: t.stakes.with, value: true },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  aria-pressed={o.active}
                  onClick={() => setWithPlan(o.value)}
                  className={`h-11 cursor-pointer rounded-full px-[22px] text-sm transition-colors duration-200 ${
                    o.active
                      ? "bg-white text-[#151533]"
                      : "bg-transparent text-[#B9B9CC] hover:text-white"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div
              className={`grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-x-8 gap-y-[18px] rounded-[32px] border p-9 transition-all duration-300 ${
                withPlan
                  ? "border-[#F0A8EF] bg-[linear-gradient(160deg,rgba(225,85,224,.16),rgba(21,21,51,.9))]"
                  : "border-white/10 bg-white/3"
              }`}
            >
              {(withPlan ? t.stakes.good : t.stakes.bad).map((s) => (
                <div key={s} className="flex items-start gap-3.5">
                  <span
                    className={`flex size-7 flex-none items-center justify-center rounded-full text-[13px] ${
                      withPlan
                        ? "bg-[rgba(79,209,165,.18)] text-[#4FD1A5]"
                        : "bg-[rgba(242,106,130,.16)] text-[#F26A82]"
                    }`}
                  >
                    {withPlan ? "✓" : "✕"}
                  </span>
                  <span className="text-base leading-[1.6] text-pretty text-[#E6E6F0]">
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="scroll-mt-16 border-t border-white/6 bg-[#0B0B1E] px-6 py-[104px]"
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
                  <span className="text-4xl font-medium tracking-[-.03em]">
                    {t.pricing.free}
                  </span>
                  <span className="text-[13.5px] text-[#9A9AAC]">
                    {t.pricing.freeSub}
                  </span>
                </div>
                <FeatureList
                  items={t.pricing.freeList}
                  checkClassName="text-[#4FD1A5]"
                />
                <StoreLink
                  className={`mt-auto h-[52px] flex-none justify-center px-4 text-center text-[15px] ${GHOST_BUTTON}`}
                >
                  {t.pricing.freeCta}
                </StoreLink>
              </div>
              <div className="relative flex flex-col gap-[22px] rounded-[32px] border border-[#F0A8EF] bg-[linear-gradient(180deg,rgba(225,85,224,.14),rgba(21,21,51,1)_60%)] p-[34px] shadow-[0_10px_50px_rgba(225,85,224,.25)]">
                <span className="absolute -top-[13px] right-7 flex h-[26px] items-center rounded-full bg-[#E155E0] px-3 text-xs font-medium text-[#151533]">
                  {t.pricing.badge}
                </span>
                <div className="flex flex-col gap-1.5">
                  <span
                    className={`self-start text-4xl font-medium tracking-[-.03em] ${GRADIENT_TEXT}`}
                  >
                    Premium
                  </span>
                  <span className="text-[13.5px] text-[#9A9AAC]">
                    {t.pricing.premiumSub}
                  </span>
                </div>
                <FeatureList
                  items={t.pricing.premiumList}
                  checkClassName="text-[#E155E0]"
                />
                <span className="text-xs leading-normal text-pretty text-[#9A9AAC]">
                  {t.pricing.note}
                </span>
                <StoreLink
                  className={`mt-auto h-[52px] justify-center px-4 text-center text-[15px] shadow-[0_8px_26px_rgba(225,85,224,.4)] ${PRIMARY_BUTTON}`}
                >
                  {t.pricing.premiumCta}
                </StoreLink>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section id="roadmap" className="px-6 py-[104px]">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-11">
            <div className="flex max-w-[760px] flex-col gap-4">
              <span className={EYEBROW}>{t.road.eyebrow}</span>
              <h2 className={H2}>{t.road.title}</h2>
              <p className="text-[17px] leading-[1.7] text-pretty text-[#C9C9DA]">
                {t.road.sub}
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5">
              {t.road.items.map((r) => (
                <div
                  key={r.h}
                  className="flex flex-col gap-3 rounded-[28px] border border-dashed border-white/20 bg-white/[.025] p-7"
                >
                  <span className="flex h-6 items-center self-start rounded-full border border-white/20 px-2.5 text-[11px] text-[#DCDCEB]">
                    {t.road.soon}
                  </span>
                  <h3 className="text-xl leading-[1.3] font-medium">{r.h}</h3>
                  <p className="text-[15px] leading-[1.7] text-pretty text-[#B9B9CC]">
                    {r.p}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 pt-6 pb-[104px]">
          <div
            className={`relative mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-center overflow-hidden rounded-[40px] ${CARD}`}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_90%_at_100%_50%,rgba(225,85,224,.16),transparent_70%)]" />
            <div className="relative flex flex-col items-start gap-6 p-[clamp(36px,6vw,72px)]">
              <h2 className="text-[clamp(34px,4.6vw,56px)] leading-[1.08] font-medium tracking-[-.035em] text-balance">
                {t.final.title}
              </h2>
              <p className="max-w-[480px] text-[17px] leading-[1.7] text-pretty text-[#C9C9DA]">
                {t.final.body}
              </p>
              <StoreLink
                className={`min-h-14 px-[30px] text-base ${PRIMARY_BUTTON}`}
              >
                {t.final.cta}
              </StoreLink>
            </div>
            <div className="relative flex min-h-[340px] items-center justify-center p-10">
              <div className="absolute size-[300px] rounded-full border border-white/8" />
              <div className="absolute size-[420px] rounded-full border border-white/5" />
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
    <div className={`flex flex-col overflow-hidden rounded-[32px] ${CARD}`}>
      <div
        className="flex h-[250px] items-center justify-center p-[22px]"
        style={{
          background: `radial-gradient(80% 80% at 50% 0%, ${glow}, transparent 70%)`,
        }}
      >
        {visual}
      </div>
      <div className="flex flex-col gap-2.5 px-7 pt-[26px] pb-[30px]">
        <span className="text-xs font-medium tracking-[.14em] text-[#E155E0]">
          {step}
        </span>
        <h3 className="flex flex-wrap items-center gap-2.5 text-[22px] font-medium">
          {title}
          {premium && <span className={PREMIUM_BADGE}>Premium</span>}
        </h3>
        <p className="text-[15px] leading-[1.7] text-pretty text-[#B9B9CC]">
          {body}
        </p>
      </div>
    </div>
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
    <div className="flex flex-col gap-3 text-[15px] text-[#E6E6F0]">
      {items.map((x) => (
        <span key={x} className="flex gap-2.5">
          <span className={checkClassName}>✓</span>
          {x}
        </span>
      ))}
    </div>
  );
}
