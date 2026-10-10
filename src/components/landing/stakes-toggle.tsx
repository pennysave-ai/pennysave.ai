"use client";

import { useState } from "react";
import type { Copy } from "./i18n";
import { CheckIcon, CrossIcon } from "./icons";

/**
 * "Two ways it can go": one toggle, two lists. Opens on the calm side; the
 * other side is one tap away. The landing page's only stateful section.
 */
export function StakesToggle({ stakes }: { stakes: Copy["stakes"] }) {
  const [withPlan, setWithPlan] = useState(true);

  return (
    <>
      <div
        role="group"
        aria-label={stakes.title}
        className="flex gap-1 rounded-full border border-white/12 bg-white/5 p-1"
      >
        {[
          { active: !withPlan, label: stakes.without, value: false },
          { active: withPlan, label: stakes.with, value: true },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={o.active}
            onClick={() => setWithPlan(o.value)}
            className={`h-11 cursor-pointer rounded-full px-[22px] text-sm transition-colors duration-200 ${
              o.active
                ? "bg-white text-card"
                : "bg-transparent text-ink-muted hover:text-white"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {/* Announce which side is showing, not all four lines again. */}
      <p aria-live="polite" className="sr-only">
        {withPlan ? stakes.with : stakes.without}
      </p>
      <ul
        className={`grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-x-8 gap-y-[18px] rounded-[32px] border p-9 motion-safe:transition-[background,border-color] motion-safe:duration-300 ${
          withPlan
            ? "border-orchid-mist bg-[linear-gradient(160deg,rgba(225,85,224,.16),rgba(21,21,51,.9))]"
            : "border-white/10 bg-white/3"
        }`}
      >
        {(withPlan ? stakes.good : stakes.bad).map((s) => (
          <li key={s} className="flex items-start gap-3.5">
            <span
              className={`flex size-7 flex-none items-center justify-center rounded-full ${
                withPlan ? "bg-mint/18 text-mint" : "bg-coral/16 text-coral"
              }`}
            >
              {withPlan ? (
                <CheckIcon width={14} height={14} />
              ) : (
                <CrossIcon width={14} height={14} />
              )}
            </span>
            <span className="text-base leading-[1.6] text-pretty text-ink-strong">
              {s}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
