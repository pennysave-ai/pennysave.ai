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
  // The list animates only after a switch, never on first paint.
  const [switched, setSwitched] = useState(false);

  return (
    <>
      <div
        role="group"
        aria-label={stakes.title}
        className="relative grid auto-cols-fr grid-flow-col gap-1 rounded-full border border-white/12 bg-white/5 p-1"
      >
        {/* One white thumb slides to the chosen side; both buttons share a
            width so it only has to travel, never resize. */}
        <span
          aria-hidden
          className={`absolute inset-y-1 left-1 w-[calc(50%-6px)] rounded-full bg-white motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] ${
            withPlan ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
          }`}
        />
        {[
          { active: !withPlan, label: stakes.without, value: false },
          { active: withPlan, label: stakes.with, value: true },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={o.active}
            onClick={() => {
              if (o.value === withPlan) return;
              setWithPlan(o.value);
              setSwitched(true);
            }}
            className={`relative h-11 cursor-pointer rounded-full px-[22px] text-sm whitespace-nowrap transition-colors duration-200 ${
              o.active ? "text-card" : "text-ink-muted hover:text-white"
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
        {(withPlan ? stakes.good : stakes.bad).map((s, i) => (
          <li
            key={s}
            className={`flex items-start gap-3.5 ${switched ? "stakes-in" : ""}`}
            style={{ ["--i" as string]: i }}
          >
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
