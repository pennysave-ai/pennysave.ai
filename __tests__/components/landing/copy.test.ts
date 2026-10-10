import {
  LANGS,
  PRICE_PERIOD,
  PRICE_PERIOD_SPOKEN,
  loadCopy,
  type Copy,
} from "@/components/landing/i18n";
import en from "@/components/landing/copy/en";

/** Every leaf path in a copy object, with array lengths, e.g. "pricing.trust[3]". */
function shape(value: unknown, path = ""): string[] {
  if (Array.isArray(value)) {
    return [
      `${path}[${value.length}]`,
      ...value.flatMap((v, i) => shape(v, `${path}[${i}]`)),
    ];
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) =>
      shape(v, path ? `${path}.${k}` : k),
    );
  }
  return [path];
}

describe("landing copy", () => {
  it.each(LANGS.map((l) => l.code))(
    "%s has exactly the same keys and list lengths as English",
    async (lang) => {
      const copy: Copy = await loadCopy(lang);
      expect(shape(copy).sort()).toEqual(shape(en).sort());
    },
  );

  it.each(LANGS.map((l) => l.code))("%s has no empty strings", async (lang) => {
    const copy = await loadCopy(lang);
    const empty: string[] = [];
    const walk = (v: unknown, path: string) => {
      if (typeof v === "string") {
        if (!v.trim()) empty.push(path);
      } else if (v && typeof v === "object") {
        for (const [k, child] of Object.entries(v)) walk(child, `${path}.${k}`);
      }
    };
    walk(copy, lang);
    expect(empty).toEqual([]);
  });

  it("names every subscription period, on screen and spoken, in every language", () => {
    const periods = Object.keys(PRICE_PERIOD.en);
    for (const { code } of LANGS) {
      expect(Object.keys(PRICE_PERIOD[code]).sort()).toEqual(periods.sort());
      expect(Object.keys(PRICE_PERIOD_SPOKEN[code]).sort()).toEqual(
        periods.sort(),
      );
      for (const spoken of Object.values(PRICE_PERIOD_SPOKEN[code])) {
        expect(spoken).not.toMatch(/\//);
      }
    }
  });
});
