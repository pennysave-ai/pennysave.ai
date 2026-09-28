/**
 * Report findings: short claims about a month that the facts either support
 * or don't.
 *
 * Nothing here is stored or written by a model. Every time a report is read
 * the month is summarised from its transactions as they are now, and these
 * rules turn that summary into claims and a health verdict. So a report can
 * never show a claim its own numbers contradict, and the client words each
 * claim in whatever language it runs in.
 *
 * Money is in milliunits of the report currency, shares and changes are
 * ratios (0.25 = 25%) — the units the mobile app already reads reports in.
 */

export const FINDING_KINDS = [
  "net_surplus",
  "net_deficit",
  "spend_up",
  "spend_down",
  "income_up",
  "income_down",
  "category_top",
  "category_up",
  "category_down",
  "category_new",
  "payee_concentration",
  "large_expense",
  "recurring_charge",
  "uncategorized",
] as const;

export type FindingKind = (typeof FINDING_KINDS)[number];

export type MonthFacts = {
  /** Positive milliunits. */
  income: number;
  /** Positive milliunits. */
  expense: number;
  /** Signed milliunits. */
  net: number;
  /** Null when the month before had no transactions. */
  prev: { income: number; expense: number; net: number } | null;
  /** Every category with spend, largest first. */
  categories: Array<{ name: string; spend: number }>;
  prevCategories: Array<{ name: string; spend: number }>;
  /** Largest first. */
  payees: Array<{ name: string; spend: number }>;
  /** Largest first. */
  largestExpenses: Array<{ payee: string; amount: number }>;
  uncategorizedSpend: number;
  recurring: Array<{
    payee: string;
    direction: string;
    months: number;
    medianAmount: number;
  }>;
};

export type Finding = {
  kind: FindingKind;
  /** Category or payee name, for the kinds that are about one. */
  subject: string | null;
  amount: number;
  previous: number | null;
  share: number | null;
  change: number | null;
  months: number | null;
  /** How much the claim matters; findings are ranked by it. */
  score: number;
};

/** The bar each kind of claim has to clear to be made at all. */
const T = {
  totalChange: 0.1,
  categoryChange: 0.25,
  categoryWeight: 0.05,
  categoryNewShare: 0.1,
  topCategoryShare: 0.25,
  payeeShare: 0.3,
  largeExpenseShare: 0.25,
  recurringMonths: 3,
  uncategorizedShare: 0.15,
} as const;

const NO_PAYEE = "(no payee)";

export function findingKey(f: Pick<Finding, "kind" | "subject">): string {
  return `${f.kind}:${f.subject ?? ""}`;
}

function finding(
  kind: FindingKind,
  values: Partial<Omit<Finding, "kind" | "score">> & {
    amount: number;
    score: number;
  },
): Finding {
  return {
    kind,
    subject: values.subject ?? null,
    amount: Math.round(values.amount),
    previous: values.previous == null ? null : Math.round(values.previous),
    share: values.share ?? null,
    change: values.change ?? null,
    months: values.months ?? null,
    score: values.score,
  };
}

function ratio(part: number, whole: number) {
  return whole > 0 ? part / whole : 0;
}

/** Every finding the facts support, highest score first. */
export function deriveFindings(facts: MonthFacts): Finding[] {
  const t = T;
  const out: Finding[] = [];
  const { income, expense, net, prev } = facts;

  if (net > 0 && income > 0) {
    out.push(
      finding("net_surplus", {
        amount: net,
        share: ratio(net, income),
        score: 0.4 + ratio(net, income),
      }),
    );
  } else if (net < 0) {
    out.push(
      finding("net_deficit", {
        amount: -net,
        share: income > 0 ? ratio(-net, income) : null,
        score: 1 + ratio(-net, Math.max(expense, 1)),
      }),
    );
  }

  if (prev && prev.expense > 0) {
    const change = (expense - prev.expense) / prev.expense;
    if (Math.abs(change) >= t.totalChange) {
      out.push(
        finding(change > 0 ? "spend_up" : "spend_down", {
          amount: expense,
          previous: prev.expense,
          change,
          score: 0.5 + Math.abs(change),
        }),
      );
    }
  }

  if (prev && prev.income > 0) {
    const change = (income - prev.income) / prev.income;
    if (Math.abs(change) >= t.totalChange) {
      out.push(
        finding(change > 0 ? "income_up" : "income_down", {
          amount: income,
          previous: prev.income,
          change,
          score: 0.4 + Math.abs(change),
        }),
      );
    }
  }

  const top = facts.categories[0];
  if (top && expense > 0 && ratio(top.spend, expense) >= t.topCategoryShare) {
    const prevTop = facts.prevCategories.find((c) => c.name === top.name);
    out.push(
      finding("category_top", {
        subject: top.name,
        amount: top.spend,
        previous: prevTop?.spend ?? null,
        share: ratio(top.spend, expense),
        score: 0.3 + ratio(top.spend, expense),
      }),
    );
  }

  // Category moves need a month to have moved from.
  if (prev && expense > 0) {
    const prevByName = new Map(
      facts.prevCategories.map((c) => [c.name, c.spend]),
    );
    for (const c of facts.categories) {
      const before = prevByName.get(c.name) ?? 0;
      const weight = Math.abs(c.spend - before) / expense;
      if (before <= 0) {
        const share = ratio(c.spend, expense);
        if (share >= t.categoryNewShare) {
          out.push(
            finding("category_new", {
              subject: c.name,
              amount: c.spend,
              share,
              score: 0.4 + share,
            }),
          );
        }
        continue;
      }
      const change = (c.spend - before) / before;
      if (change >= t.categoryChange && weight >= t.categoryWeight) {
        out.push(
          finding("category_up", {
            subject: c.name,
            amount: c.spend,
            previous: before,
            change,
            share: ratio(c.spend, expense),
            score: 0.5 + weight * 2,
          }),
        );
      }
    }
    // A category can fall to nothing, so this walks the previous month.
    const nowByName = new Map(facts.categories.map((c) => [c.name, c.spend]));
    for (const p of facts.prevCategories) {
      if (p.spend <= 0) continue;
      const now = nowByName.get(p.name) ?? 0;
      const change = (now - p.spend) / p.spend;
      const weight = (p.spend - now) / expense;
      if (change <= -t.categoryChange && weight >= t.categoryWeight) {
        out.push(
          finding("category_down", {
            subject: p.name,
            amount: now,
            previous: p.spend,
            change,
            share: ratio(now, expense),
            score: 0.4 + weight * 2,
          }),
        );
      }
    }
  }

  const topPayee = facts.payees.find((p) => p.name !== NO_PAYEE);
  if (topPayee && ratio(topPayee.spend, expense) >= t.payeeShare) {
    out.push(
      finding("payee_concentration", {
        subject: topPayee.name,
        amount: topPayee.spend,
        share: ratio(topPayee.spend, expense),
        score: 0.3 + ratio(topPayee.spend, expense),
      }),
    );
  }

  const largest = facts.largestExpenses[0];
  if (largest && ratio(largest.amount, expense) >= t.largeExpenseShare) {
    out.push(
      finding("large_expense", {
        // A payment with no payee is still worth naming; the client words it
        // without one rather than print the placeholder.
        subject: largest.payee === NO_PAYEE ? null : largest.payee,
        amount: largest.amount,
        share: ratio(largest.amount, expense),
        score: 0.3 + ratio(largest.amount, expense),
      }),
    );
  }

  for (const r of facts.recurring) {
    if (r.direction !== "expense" || r.months < t.recurringMonths) continue;
    out.push(
      finding("recurring_charge", {
        subject: r.payee,
        amount: r.medianAmount,
        months: r.months,
        share: ratio(r.medianAmount, expense),
        score: 0.2 + ratio(r.medianAmount, expense),
      }),
    );
  }

  const uncategorizedShare = ratio(facts.uncategorizedSpend, expense);
  if (uncategorizedShare >= t.uncategorizedShare) {
    out.push(
      finding("uncategorized", {
        amount: facts.uncategorizedSpend,
        share: uncategorizedShare,
        score: 0.2 + uncategorizedShare,
      }),
    );
  }

  return out.sort((a, b) => b.score - a.score);
}

export const MAX_HIGHLIGHTS = 4;

/**
 * The findings a report leads with: the highest-scoring one of each kind
 * first, then the rest by score. Without that, a month where three
 * categories rose says the same thing three times and nothing else.
 */
export function topFindings(
  facts: MonthFacts,
  limit = MAX_HIGHLIGHTS,
): Finding[] {
  const all = deriveFindings(facts);
  const seen = new Set<FindingKind>();
  const firsts: Finding[] = [];
  const rest: Finding[] = [];
  for (const f of all) {
    if (seen.has(f.kind)) {
      rest.push(f);
    } else {
      seen.add(f.kind);
      firsts.push(f);
    }
  }
  return [...firsts, ...rest].slice(0, limit);
}

/**
 * Red when more went out than came in, green when at least a tenth of income
 * was kept, yellow in between.
 */
export function ruleHealth(facts: MonthFacts): "green" | "yellow" | "red" {
  if (facts.net < 0) return "red";
  if (facts.income > 0 && facts.net >= facts.income * 0.1) return "green";
  return "yellow";
}
