/** @jest-environment node */
import {
  type MonthFacts,
  deriveFindings,
  findingKey,
  ruleHealth,
  topFindings,
} from "@/lib/reportFindings";

// Milliunits: 1_000 = one unit of currency.
function facts(overrides: Partial<MonthFacts> = {}): MonthFacts {
  return {
    income: 5_000_000,
    expense: 4_000_000,
    net: 1_000_000,
    prev: { income: 5_000_000, expense: 4_000_000, net: 1_000_000 },
    categories: [
      { name: "Housing", spend: 1_500_000 },
      { name: "Groceries", spend: 800_000 },
      { name: "Dining", spend: 600_000 },
    ],
    prevCategories: [
      { name: "Housing", spend: 1_500_000 },
      { name: "Groceries", spend: 800_000 },
      { name: "Dining", spend: 600_000 },
    ],
    payees: [{ name: "landlord", spend: 1_500_000 }],
    largestExpenses: [{ payee: "landlord", amount: 1_500_000 }],
    uncategorizedSpend: 0,
    recurring: [],
    ...overrides,
  };
}

const kinds = (f: MonthFacts) => deriveFindings(f).map(findingKey);

describe("deriveFindings", () => {
  it("reports a surplus or a deficit, never both", () => {
    expect(kinds(facts())).toContain("net_surplus:");
    const deficit = kinds(facts({ net: -200_000 }));
    expect(deficit).toContain("net_deficit:");
    expect(deficit).not.toContain("net_surplus:");
  });

  it("needs a previous month for any comparison", () => {
    const f = facts({
      prev: null,
      expense: 8_000_000,
      prevCategories: [],
    });
    const keys = kinds(f);
    expect(keys.some((k) => k.startsWith("spend_"))).toBe(false);
    expect(keys.some((k) => k.startsWith("category_new"))).toBe(false);
  });

  it("needs a 10% move to call spending up", () => {
    expect(kinds(facts({ expense: 4_280_000 }))).not.toContain("spend_up:");
    expect(kinds(facts({ expense: 4_400_000 }))).toContain("spend_up:");
  });

  it("finds a category that rose, and one that fell to nothing", () => {
    const f = facts({
      categories: [
        { name: "Housing", spend: 1_500_000 },
        { name: "Groceries", spend: 1_400_000 },
      ],
    });
    const keys = kinds(f);
    expect(keys).toContain("category_up:Groceries");
    expect(keys).toContain("category_down:Dining");
    const dining = deriveFindings(f).find((x) => x.subject === "Dining")!;
    expect(dining.amount).toBe(0);
    expect(dining.previous).toBe(600_000);
    expect(dining.change).toBe(-1);
  });

  it("ignores a large percentage move on a small category", () => {
    const f = facts({
      categories: [...facts().categories, { name: "Books", spend: 60_000 }],
      prevCategories: [
        ...facts().prevCategories,
        { name: "Books", spend: 20_000 },
      ],
    });
    expect(kinds(f)).not.toContain("category_up:Books");
  });

  it("does not name '(no payee)' as the payee taking the most", () => {
    const f = facts({
      payees: [
        { name: "(no payee)", spend: 3_000_000 },
        { name: "shop", spend: 500_000 },
      ],
    });
    expect(kinds(f).some((k) => k.startsWith("payee_concentration"))).toBe(
      false,
    );
  });

  it("orders by score", () => {
    const scores = deriveFindings(facts({ net: -500_000 })).map((f) => f.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});

describe("topFindings", () => {
  it("takes one of each kind before a second of any", () => {
    // Three categories rose, and spending as a whole is up.
    const f = facts({
      expense: 5_600_000,
      net: -600_000,
      categories: [
        { name: "Housing", spend: 2_000_000 },
        { name: "Groceries", spend: 1_300_000 },
        { name: "Dining", spend: 1_100_000 },
      ],
    });
    expect(
      deriveFindings(f).filter((x) => x.kind === "category_up"),
    ).toHaveLength(3);

    const top = topFindings(f);
    expect(top).toHaveLength(4);
    expect(top.filter((x) => x.kind === "category_up")).toHaveLength(1);
    expect(top.map((x) => x.kind)).toEqual(
      expect.arrayContaining(["net_deficit", "spend_up"]),
    );
  });

  it("repeats a kind only once the others run out", () => {
    const f = facts({
      // Nothing but two recurring charges to say.
      net: 0,
      income: 4_000_000,
      prev: null,
      categories: [],
      payees: [],
      largestExpenses: [],
      recurring: [
        { payee: "gym", direction: "expense", months: 3, medianAmount: 50_000 },
        {
          payee: "stream",
          direction: "expense",
          months: 4,
          medianAmount: 15_000,
        },
      ],
    });
    const top = topFindings(f).map(findingKey);
    expect(top).toContain("recurring_charge:gym");
    expect(top).toContain("recurring_charge:stream");
  });
});

describe("ruleHealth", () => {
  it("maps net flow to a colour", () => {
    expect(ruleHealth(facts({ net: -1 }))).toBe("red");
    expect(ruleHealth(facts({ net: 600_000 }))).toBe("green");
    expect(ruleHealth(facts({ net: 100_000 }))).toBe("yellow");
  });
});
