import { FREE_TRIAL_DAYS } from "./shared";

/**
 * English copy for the landing page, mirrored from the "Landing Page" design.
 * The other languages are typed against this one.
 */
const en = {
  nav: {
    why: "Why",
    how: "How it works",
    plans: "Plans",
    getApp: "Get the app",
    language: "Language",
    skip: "Skip to content",
    opensStore: "(opens the App Store)",
  },
  hero: {
    badge: "Budgeting for iPhone, made effortless",
    h1a: "Know where every penny goes.",
    h1b: "Without the spreadsheet.",
    sub: "Add a payment in three taps and see your whole month at a glance: what came in, what went out, and where it all went. Money stops feeling like homework and starts feeling like winning.",
    start: "Start free",
    how: "See how it works",
    meta: "iPhone app · Free plan forever · No bank login needed",
  },
  problem: {
    eyebrow: "SOUND FAMILIAR?",
    title: "Payday feels great. The 24th doesn’t.",
    items: [
      {
        h: "The money just… goes.",
        p: "Coffees, subscriptions, a dinner split four ways. By the end of the month you honestly can’t say where it went.",
      },
      {
        h: "You feel behind — and a bit guilty.",
        p: "Every budgeting app you tried wanted an hour of typing each week. You stopped opening it, and the worry came back.",
      },
      {
        h: "It shouldn’t be this hard.",
        p: "Looking after your money should feel like progress, not punishment. You deserve to feel in control without becoming an accountant.",
      },
    ],
  },
  guide: {
    eyebrow: "YOU’RE NOT BAD WITH MONEY",
    title: "You just had the wrong tools. We built the right one.",
    body: "We made PennySave because we were tired of apps that made us feel worse. So we took the work out: a payment takes three taps, and the picture of your month is always one glance away.",
    cards: [
      [
        "Receipt recognition",
        "Snap a photo — amount, shop and category fill themselves in.",
      ],
      [
        "AI monthly reports",
        "Every month, a plain-language summary of what changed and where your money went.",
      ],
      [
        "Shared accounts",
        "Share with a partner or flatmates, fully in the open.",
      ],
      [
        "Your money, your language",
        "Euro, pound, dollar, HK dollar — in English, German, French or Spanish.",
      ],
    ],
  },
  plan: {
    eyebrow: "THE PLAN",
    title: "Three steps to a calmer month",
    step: "STEP",
    s1h: "Add it in seconds",
    s1p: "Type the amount, pick a category, done — free, forever. On Premium, snap the receipt and it fills itself in.",
    s2h: "See it",
    s2p: "Your month in one picture: daily spending, what came in, what went out. On Premium, AI writes you a report at the end of every month.",
    aiLabel: "AI report · Premium",
    taps: "Three taps: amount, category, save",
    aiText:
      "Eating out is up 18% on August — mostly weekends. Groceries held steady.",
    s3h: "Share it",
    s3p: "Share an account with your partner or flatmates — everyone sees every payment, and who added it.",
  },
  stakes: {
    eyebrow: "NEXT MONTH",
    title: "Two ways it can go",
    without: "Without a plan",
    with: "With PennySave",
    bad: [
      "Payday hits and the money is gone by the 20th.",
      "Surprise subscriptions keep quietly renewing.",
      "Awkward “who owes what?” chats after every shared bill.",
      "That low-level worry every time you tap your card.",
    ],
    good: [
      "You know exactly where this month’s money went.",
      "Subscriptions stop sneaking up on you — they’re right there in your month.",
      "Shared costs are visible to everyone, no chasing.",
      "Money feels like progress. You start saving on purpose.",
    ],
  },
  pricing: {
    eyebrow: "PLANS",
    title: "Start free. Go Premium when it clicks.",
    free: "Free",
    freeSub: "Forever. No card needed.",
    freeList: [
      "Unlimited transactions",
      "Accounts & categories",
      "Monthly dashboard: spent, in, out, net",
    ],
    premiumSub: `Try it free for ${FREE_TRIAL_DAYS} days.`,
    premiumList: [
      "Everything in Free",
      "Receipt recognition",
      "Shared accounts",
      "AI-generated monthly reports",
    ],
    cta: "Download free — try Premium in the app",
    trust: [
      "iPhone only",
      "No bank login needed",
      "Cancel any time in the App Store",
    ],
    note: "Start the trial from inside the app. Billed through the App Store, cancel any time.",
    badge: `${FREE_TRIAL_DAYS} days free`,
  },
  road: {
    eyebrow: "ON THE ROADMAP",
    title: "What’s coming next",
    sub: "PennySave keeps growing. Here’s what we’re building now.",
    soon: "Coming soon",
    items: [
      {
        h: "Budgets & alerts",
        p: "Set a limit per category and get a notification before you go over.",
      },
      {
        h: "Talk to Siri",
        p: "An AI assistant you can ask about your budgets and spending, right through Siri.",
      },
      {
        h: "Bank card linking",
        p: "Payments imported automatically through Apple FinanceKit. Premium, US only.",
      },
    ],
  },
  community: {
    eyebrow: "HELP SHAPE IT",
    title: "Missing something? Tell us.",
    sub: "The roadmap above came from people like you. Tell us what would make PennySave work better for you — we read every request.",
    idea: "Your idea",
    ideaPh: "I’d love it if PennySave could…",
    email: "Email (optional)",
    emailPh: "you@example.com",
    emailNote: "Only if you’d like to hear back from us.",
    send: "Send request",
    sending: "Sending…",
    sent: "Thanks! Your request is on its way to the team.",
    another: "Send another",
    error:
      "Something went wrong. Please try again, or write to support@pennysave.ai.",
    limit: "That’s a lot of ideas! Please try again a little later.",
    tooShort: "Please write at least 10 characters.",
    badEmail: "Please enter a valid email address, or leave it empty.",
  },
  final: {
    title: "From “where did it go?” to “I’ve got this.”",
    body: "Your first calm month starts with one download. Adding a payment takes three taps.",
    cta: "Get PennySave — it’s free",
  },
  foot: { terms: "Terms", privacy: "Privacy", support: "Support" },
  ph: {
    save: "Save",
    all: "All accounts",
    meta: "3 accounts · USD",
    month: "September",
    spent: "SPENT",
    partial: "1–24 Sep",
    daily: "Daily · today dashed, still counting",
    payments: "46 payments",
    in: "IN",
    out: "OUT",
    net: "NET",
    tx: "TRANSACTIONS",
    hold: "hold a row to edit",
    today: "Today",
    yesterday: "Yesterday",
    by: "Added by",
  },
  cat: {
    eat: "Eating out",
    groc: "Groceries",
    income: "Income",
    transport: "Transport",
    everyday: "Everyday",
    family: "Family",
  },
  names: {
    cafe: "Corner Café",
    market: "Fresh Market",
    dinner: "Dinner with Lena",
    salary: "Salary",
    metro: "Metro pass",
    shop: "Weekly shop",
  },
};

export default en;
