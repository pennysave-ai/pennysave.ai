"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type InvalidEvent,
} from "react";
import type { Copy, Lang } from "./i18n";
import { CheckIcon } from "./icons";
import { CARD, EYEBROW, GHOST_BUTTON, PRIMARY_BUTTON } from "./styles";

const FIELD =
  "w-full rounded-2xl border border-white/35 bg-midnight px-4 text-[15px] text-white placeholder:text-ink-placeholder transition-colors outline-none focus:border-orchid focus:ring-2 focus:ring-orchid/25";
const LABEL = "text-sm font-medium text-ink-label";

type Status = "idle" | "sending" | "sent" | "error" | "limit";

/** "Request a feature" form, below the roadmap. Social links live in the footer. */
export function CommunitySection({ t, lang }: { t: Copy; lang: Lang }) {
  const c = t.community;

  return (
    <section
      id="feedback"
      className="scroll-mt-20 border-t border-white/6 bg-night px-6 py-[104px]"
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-14">
        <div className="flex flex-col gap-5">
          <span className={EYEBROW}>{c.eyebrow}</span>
          <h2 className="text-[clamp(32px,4.4vw,52px)] leading-[1.1] font-medium tracking-[-.03em] text-balance">
            {c.title}
          </h2>
          <p className="max-w-[520px] text-lg leading-[1.7] text-pretty text-ink-lead">
            {c.sub}
          </p>
        </div>
        <FeatureRequestForm c={c} lang={lang} />
      </div>
    </section>
  );
}

function FeatureRequestForm({ c, lang }: { c: Copy["community"]; lang: Lang }) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const sentRef = useRef<HTMLDivElement>(null);
  const ideaRef = useRef<HTMLTextAreaElement>(null);
  const wasSent = useRef(false);

  // Move focus with the swap, so keyboard and screen-reader users land on the
  // confirmation, and back on the field after "Send another".
  useEffect(() => {
    if (status === "sent") {
      sentRef.current?.focus();
      wasSent.current = true;
    } else if (status === "idle" && wasSent.current) {
      ideaRef.current?.focus();
      wasSent.current = false;
    }
  }, [status]);

  // Browser validation bubbles speak the browser's language; use the site's.
  const invalid =
    (msg: string) =>
    (e: InvalidEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      e.currentTarget.setCustomValidity(msg);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/feature-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, email, lang, trap }),
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
        ref={sentRef}
        tabIndex={-1}
        role="status"
        className={`flex min-h-[360px] outline-none flex-col items-center justify-center gap-5 rounded-[32px] p-[34px] text-center ${CARD}`}
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-mint/18 text-mint">
          <CheckIcon width={26} height={26} />
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
          ref={ideaRef}
          value={message}
          onInvalid={invalid(c.tooShort)}
          onChange={(e) => {
            e.currentTarget.setCustomValidity("");
            setMessage(e.target.value);
          }}
          placeholder={c.ideaPh}
          className={`${FIELD} resize-y py-3 leading-[1.6]`}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className={LABEL}>{c.email}</span>
        <input
          type="email"
          aria-describedby="feature-email-note"
          autoComplete="email"
          maxLength={254}
          value={email}
          onInvalid={invalid(c.badEmail)}
          onChange={(e) => {
            e.currentTarget.setCustomValidity("");
            setEmail(e.target.value);
          }}
          placeholder={c.emailPh}
          className={`${FIELD} h-12`}
        />
        <span id="feature-email-note" className="text-xs text-ink-quiet">
          {c.emailNote}
        </span>
      </label>
      {/* Honeypot: people never see this field, bots fill it in. The name and
          data attributes keep browser and password-manager autofill out. */}
      <input
        type="text"
        name="ps_trap"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      {(status === "error" || status === "limit") && (
        <p role="alert" className="text-sm text-orchid-mist">
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
