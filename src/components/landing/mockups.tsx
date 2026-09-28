import type { Copy } from "./i18n";
import { dailyBars, type MockData } from "./mock-data";

const APP_GRADIENT =
  "bg-[linear-gradient(163deg,#B838B4_0%,#A93FC6_44%,#8A4BD0_100%)]";
const glassPill = "rounded-full border border-white/48 bg-[rgba(12,12,28,.22)]";

const BARS = dailyBars(1);
const MINI_BARS = dailyBars(0.7);

type Props = { t: Copy; m: MockData };

/** iPhone frame showing the app's monthly dashboard. */
export function PhoneMockup({ t, m }: Props) {
  return (
    <div className="relative flex justify-center py-2.5">
      <div className="relative h-[686px] w-[328px] flex-none rounded-[54px] border border-[#3A3A5C] bg-[#26264A] p-[11px] shadow-[0_40px_90px_rgba(0,0,0,.6)]">
        <div className="relative h-[664px] w-[306px] overflow-hidden rounded-[44px] bg-[#151533]">
          <div className="absolute top-0 left-0 h-[852px] w-[393px] origin-top-left scale-[.7786] bg-[#151533] text-white">
            <div
              className={`absolute inset-x-0 top-0 h-[520px] ${APP_GRADIENT}`}
            />
            <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(120%_62%_at_88%_0%,rgba(225,85,224,.22),transparent_66%),linear-gradient(180deg,rgba(12,12,28,.14),rgba(12,12,28,.04)_58%)]" />

            <div className="relative flex flex-col">
              <div className="flex h-[54px] items-end justify-center pb-1 text-[13px]">
                9:41
              </div>

              <div className="flex h-[54px] items-center gap-2.5 px-4 pb-3.5">
                <div
                  className={`flex size-10 flex-none flex-col items-center justify-center gap-1 ${glassPill}`}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-[1.6px] w-4 rounded-sm bg-white"
                    />
                  ))}
                </div>
                <div
                  className={`flex h-10 min-w-0 flex-1 items-center gap-[9px] pr-1.5 pl-3 ${glassPill}`}
                >
                  <span className="size-2 flex-none rounded-full bg-[#6FA8FF]" />
                  <span className="flex min-w-0 flex-1 flex-col gap-px">
                    <span className="text-[13.5px] whitespace-nowrap">
                      {t.ph.all}
                    </span>
                    <span className="text-[10px] font-medium whitespace-nowrap">
                      {t.ph.meta}
                    </span>
                  </span>
                  <span className="flex-none pr-2 pl-0.5 text-[11px] font-medium">
                    ▾
                  </span>
                </div>
                <div
                  className={`flex size-10 flex-none items-center justify-center ${glassPill}`}
                >
                  <span className="flex h-[15px] w-[19px] items-center justify-center rounded border-[1.4px] border-white">
                    <span className="size-[7px] rounded-full border-[1.4px] border-white" />
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-5 pb-3.5">
                <div className="flex size-[34px] flex-none items-center justify-center rounded-full border border-white/44 bg-[rgba(12,12,28,.2)] text-sm">
                  ‹
                </div>
                <span className="flex-1 text-center text-[14.5px] font-medium">
                  {t.ph.month}
                </span>
                <div className="flex size-[34px] flex-none items-center justify-center rounded-full border border-white/44 bg-[rgba(12,12,28,.2)] text-sm opacity-40">
                  ›
                </div>
              </div>

              <div className="flex flex-col gap-2.5 px-5 pt-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-medium tracking-[.14em]">
                    {t.ph.spent}
                  </span>
                  <span className="flex-1" />
                  <span className="text-[10.5px] font-medium">
                    {t.ph.partial}
                  </span>
                </div>
                <span className="text-[40px] leading-none font-medium tracking-[-.025em] tabular-nums">
                  {m.money.spent}
                </span>
                <div className="flex h-14 items-end gap-[1.5px]">
                  {BARS.map((style, i) => (
                    <span
                      key={i}
                      className="flex h-14 min-w-0 flex-1 items-end"
                    >
                      <span
                        className="block w-full rounded-t-[2px]"
                        style={style}
                      />
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2 text-[10px] font-medium">
                  <span>{t.ph.daily}</span>
                  <span>{t.ph.payments}</span>
                </div>
              </div>

              <div className="mx-5 mt-3.5 flex border-t border-white/38 pt-3.5">
                <Stat label={`${t.ph.in} ›`} value={m.money.in} />
                <span className="mx-3.5 w-px flex-none bg-white/36" />
                <Stat label={`${t.ph.out} ›`} value={m.money.spent} />
                <span className="mx-3.5 w-px flex-none bg-white/36" />
                <Stat
                  label={t.ph.net}
                  value={m.money.net}
                  valueClassName="text-[#7CE0B0]"
                />
              </div>
            </div>

            <div className="absolute inset-x-0 top-[418px] bottom-0 flex flex-col overflow-hidden rounded-t-[32px] border-t border-white/14 bg-[#1B1B33] shadow-[0_-18px_44px_rgba(0,0,0,.45)]">
              <div className="flex justify-center pt-2.5 pb-1.5">
                <span className="h-1 w-10 rounded-full bg-white/30" />
              </div>
              <div className="flex items-center gap-2 px-[18px] pt-1 pb-1.5">
                <span className="text-[11px] font-medium tracking-[.1em]">
                  {t.ph.tx}
                </span>
                <span className="flex-1" />
                <span className="text-[11px] text-[#7E7E8F]">{t.ph.hold}</span>
              </div>
              <div className="flex items-center px-[18px] pt-2.5 pb-1 text-[11.5px]">
                <span className="flex-1 text-[#DCDCEB]">{t.ph.today}</span>
                <span className="text-[#8E8EA6]">{m.money.today}</span>
              </div>
              {m.transactions.map((r) => (
                <div
                  key={r.n}
                  className="mx-2 flex items-center gap-3 px-2.5 py-[9px]"
                >
                  <span className="relative flex size-[42px] flex-none items-center justify-center rounded-[14px] border border-white/12 bg-white/7 text-[17px]">
                    {r.e}
                    {r.other && (
                      <span className="absolute -right-[5px] -bottom-[5px] flex size-5 items-center justify-center rounded-full border-2 border-[#1B1B33] bg-[#E4829B] text-[7.5px] font-medium text-[#151533]">
                        AK
                      </span>
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="truncate text-[13.5px]">{r.n}</span>
                    <span className="truncate text-[11px] text-[#7E7E8F]">
                      {r.c}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-[3px]">
                    <span
                      className={`text-[13.5px] font-medium whitespace-nowrap tabular-nums ${r.income ? "text-[#7CE0B0]" : "text-white"}`}
                    >
                      {r.a}
                    </span>
                    <span className="text-[10px] text-[#5F5F72]">{r.time}</span>
                  </span>
                  <span className="text-[13px] text-[#5F5F72]">›</span>
                </div>
              ))}
            </div>

            <div className="absolute right-[18px] bottom-[26px] flex size-[70px] items-center justify-center rounded-full bg-[linear-gradient(180deg,#E4829B,#E155E0,#AE66E8)] text-[34px] leading-none shadow-[0_14px_30px_rgba(225,85,224,.42)]">
              +
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-[10.5px] font-medium tracking-[.1em]">{label}</span>
      <span
        className={`text-lg font-medium whitespace-nowrap tabular-nums ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}

/** Step 1: amount entry with keypad. */
export function AddMockup({ t, m }: Props) {
  return (
    <div className="flex w-[230px] flex-col gap-2.5 rounded-[20px] border border-white/14 bg-[#1B1B33] p-3.5">
      <div className="flex items-center gap-1">
        <span className="text-[28px] leading-none font-medium tracking-[-.02em]">
          {m.money.coffee}
        </span>
        <span className="ml-0.5 h-6 w-0.5 bg-[#E155E0]" />
      </div>
      <span className="flex h-6 items-center self-start rounded-full bg-[rgba(225,85,224,.18)] px-2.5 text-[11px] whitespace-nowrap text-[#F0A8EF]">
        ☕ {t.cat.eat}
      </span>
      <div className="grid grid-cols-3 gap-[5px]">
        {m.keys.map((k) => (
          <span
            key={k}
            className="flex h-[26px] items-center justify-center rounded-[9px] bg-white/7 text-xs text-[#DCDCEB]"
          >
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Step 2: monthly summary card with an AI report note. */
export function SeeMockup({ t, m }: Props) {
  return (
    <div className="flex w-[250px] flex-col gap-2.5">
      <div
        className={`flex flex-col gap-2 rounded-[20px] px-4 py-3.5 shadow-[0_14px_34px_rgba(0,0,0,.35)] ${APP_GRADIENT}`}
      >
        <span className="text-[9.5px] font-medium tracking-[.14em]">
          {t.ph.spent} · {t.ph.partial}
        </span>
        <span className="text-[26px] leading-none font-medium tracking-[-.02em]">
          {m.money.spent}
        </span>
        <div className="flex h-10 items-end gap-[1.5px]">
          {MINI_BARS.map((style, i) => (
            <span key={i} className="flex-1 rounded-t-[2px]" style={style} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1 rounded-[14px] border border-[rgba(240,168,239,.45)] bg-[#1B1B33] px-3 py-[9px] shadow-[0_12px_30px_rgba(0,0,0,.45)]">
        <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#F0A8EF]">
          ✦ {t.plan.aiLabel}
        </span>
        <span className="text-[10.5px] leading-normal text-pretty text-[#DCDCEB]">
          {t.plan.aiText}
        </span>
      </div>
    </div>
  );
}

const MEMBERS = [
  { i: "AK", bg: "bg-[#E4829B]" },
  { i: "LP", bg: "bg-[#E155E0]" },
  { i: "ME", bg: "bg-[#AE66E8]" },
];

/** Step 3: shared account with members. */
export function ShareMockup({ t, m }: Props) {
  return (
    <div className="flex w-[250px] flex-col gap-2.5 rounded-[20px] border border-white/14 bg-[#1B1B33] p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="size-2 rounded-full bg-[#E4829B]" />
        <span className="flex-1 text-[13px]">{t.cat.family}</span>
        <span className="flex pl-1.5">
          {MEMBERS.map((p) => (
            <span
              key={p.i}
              className={`-ml-1.5 flex size-6 items-center justify-center rounded-full border-2 border-[#1B1B33] text-[8.5px] text-[#151533] ${p.bg}`}
            >
              {p.i}
            </span>
          ))}
        </span>
      </div>
      {m.shared.map((s) => (
        <div key={s.n} className="flex items-center gap-2.5">
          <span className="relative flex size-8 flex-none items-center justify-center rounded-[11px] border border-white/12 bg-white/7 text-[13px]">
            {s.e}
            <span
              className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full border-2 border-[#1B1B33] text-[6px] font-medium text-[#151533]"
              style={{ background: s.bg }}
            >
              {s.i}
            </span>
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-px">
            <span className="truncate text-[11.5px]">{s.n}</span>
            <span className="text-[9.5px] text-[#7E7E8F]">{s.by}</span>
          </span>
          <span className="text-[11.5px] font-medium whitespace-nowrap">
            {s.a}
          </span>
        </div>
      ))}
    </div>
  );
}
