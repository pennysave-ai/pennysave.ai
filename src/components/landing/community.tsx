"use client";

import { useState, type FormEvent } from "react";
import type { Copy, Lang } from "./i18n";
import {
  CARD,
  EYEBROW,
  GHOST_BUTTON,
  PRIMARY_BUTTON,
  SOCIAL_LINKS,
} from "./site-chrome";

const FIELD =
  "w-full rounded-2xl border border-white/12 bg-[#0E0E24] px-4 text-[15px] text-white placeholder:text-[#6E6E88] transition-colors outline-none focus:border-[#E155E0] focus:ring-2 focus:ring-[rgba(225,85,224,.25)]";
const LABEL = "text-sm font-medium text-[#DCDCEB]";

type Status = "idle" | "sending" | "sent" | "error" | "limit";

/** "Request a feature" form and the social links, below the roadmap. */
export function CommunitySection({ t, lang }: { t: Copy; lang: Lang }) {
  const c = t.community;

  return (
    <section
      id="feedback"
      className="scroll-mt-16 border-t border-white/6 bg-[#0B0B1E] px-6 py-[104px]"
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-14">
        <div className="flex flex-col gap-5">
          <span className={EYEBROW}>{c.eyebrow}</span>
          <h2 className="text-[clamp(32px,4.4vw,52px)] leading-[1.1] font-medium tracking-[-.03em] text-balance">
            {c.title}
          </h2>
          <p className="max-w-[520px] text-[17px] leading-[1.7] text-pretty text-[#C9C9DA]">
            {c.sub}
          </p>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-lg font-medium">{c.followTitle}</span>
              <span className="text-[14px] text-[#9A9AAC]">{c.followSub}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {SOCIAL_LINKS.map(({ name, handle, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`h-12 gap-2.5 px-5 text-[15px] ${GHOST_BUTTON}`}
                >
                  <Icon width={20} height={20} />
                  <span>{name}</span>
                  <span className="text-[#9A9AAC]">{handle}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <FeatureRequestForm c={c} lang={lang} />
      </div>
    </section>
  );
}

function FeatureRequestForm({ c, lang }: { c: Copy["community"]; lang: Lang }) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/feature-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, email, lang, website }),
      });
      if (res.ok) {
        setStatus("sent");
        setMessage("");
        setEmail("");
      } else {
        setStatus(res.status === 429 ? "limit" : "error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        className={`flex min-h-[360px] flex-col items-center justify-center gap-5 rounded-[32px] p-[34px] text-center ${CARD}`}
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-[rgba(79,209,165,.18)] text-2xl text-[#4FD1A5]">
          ✓
        </span>
        <p className="max-w-[340px] text-lg leading-[1.5] text-balance">
          {c.sent}
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className={`h-11 cursor-pointer px-5 text-sm ${GHOST_BUTTON}`}
        >
          {c.another}
        </button>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form
      onSubmit={onSubmit}
      className={`flex flex-col gap-5 rounded-[32px] p-[clamp(24px,4vw,34px)] ${CARD}`}
    >
      <label className="flex flex-col gap-2">
        <span className={LABEL}>{c.idea}</span>
        <textarea
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={c.ideaPh}
          className={`${FIELD} resize-y py-3 leading-[1.6]`}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className={LABEL}>{c.email}</span>
        <input
          type="email"
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={c.emailPh}
          className={`${FIELD} h-12`}
        />
        <span className="text-xs text-[#9A9AAC]">{c.emailNote}</span>
      </label>
      {/* Honeypot: people never see this field, bots fill it in */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      {(status === "error" || status === "limit") && (
        <p role="alert" className="text-sm text-[#F26A82]">
          {status === "limit" ? c.limit : c.error}
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        className={`h-[52px] cursor-pointer justify-center px-6 text-[15px] disabled:cursor-wait disabled:opacity-60 ${PRIMARY_BUTTON}`}
      >
        {sending ? c.sending : c.send}
      </button>
    </form>
  );
}
