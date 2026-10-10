import type { CSSProperties } from "react";
import { LOCALE, type Copy, type Lang } from "./i18n";

// Sample data shown in the app mockups (September, "today" is the 24th).
const DAILY_SPEND = [
  22, 38, 14, 50, 30, 8, 44, 26, 18, 56, 34, 12, 40, 28, 20, 48, 16, 36, 24, 52,
  30, 10, 42,
];
const TODAY = 24;

export function dailyBars(scale: number): CSSProperties[] {
  return Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    if (day < TODAY) {
      return {
        height: Math.max(3, DAILY_SPEND[i] * scale),
        background: "#fff",
        opacity: 0.92,
      };
    }
    if (day === TODAY) {
      return { height: 30 * scale, border: "1.2px dashed #fff" };
    }
    return { height: 3, background: "#fff", opacity: 0.28 };
  });
}

/** `currency`: the visitor's store currency, so sample amounts match the price. */
export function mockData(lang: Lang, t: Copy, currency: string) {
  const nf = new Intl.NumberFormat(LOCALE[lang], {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  });
  const money = (v: number, sign = false) =>
    (sign && v > 0 ? "+" : "") + nf.format(v);
  const c = t.cat;
  const n = t.names;

  return {
    money: {
      spent: money(1187.4),
      in: money(2400),
      net: money(1212.6, true),
      today: money(38.3),
      coffee: money(4.1),
    },
    keys: [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      lang === "en" ? "." : ",",
      "0",
      "⌫",
    ],
    transactions: [
      {
        e: "☕",
        n: n.cafe,
        c: `${c.eat} · ${c.everyday}`,
        a: money(4.1),
        income: false,
        time: "09:12",
        other: false,
      },
      {
        e: "🛒",
        n: n.market,
        c: `${c.groc} · ${c.everyday}`,
        a: money(34.2),
        income: false,
        time: "08:40",
        other: false,
      },
      {
        e: "🍝",
        n: n.dinner,
        c: `Anna · ${c.eat} · ${c.family}`,
        a: money(26.5),
        income: false,
        time: t.ph.yesterday,
        other: true,
      },
      {
        e: "💼",
        n: n.salary,
        c: `${c.income} · ${c.everyday}`,
        a: money(2400, true),
        income: true,
        time: "1.9.",
        other: false,
      },
      {
        e: "🚆",
        n: n.metro,
        c: `${c.transport} · ${c.everyday}`,
        a: money(49),
        income: false,
        time: "1.9.",
        other: false,
      },
    ],
    shared: [
      {
        e: "🍝",
        n: n.dinner,
        by: `${t.ph.by} Anna`,
        i: "AK",
        bg: "#E4829B",
        a: money(26.5),
      },
      {
        e: "🛒",
        n: n.shop,
        by: `${t.ph.by} Lena`,
        i: "LP",
        bg: "#E155E0",
        a: money(62.8),
      },
    ],
  };
}

export type MockData = ReturnType<typeof mockData>;
