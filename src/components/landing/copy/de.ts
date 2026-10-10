import type { Copy } from "../i18n";
import { FREE_TRIAL_DAYS } from "./shared";

/** German landing-page copy (mirrors ./en.ts). */
const de: Copy = {
  nav: {
    why: "Warum",
    how: "So funktioniert’s",
    plans: "Pläne",
    getApp: "App laden",
    language: "Sprache",
    skip: "Zum Inhalt springen",
    opensStore: "(öffnet den App Store)",
  },
  hero: {
    badge: "Budgetplanung fürs iPhone – ganz mühelos",
    h1a: "Wisse, wohin jeder Cent geht.",
    h1b: "Ganz ohne Tabelle.",
    sub: "Eine Ausgabe in drei Taps erfassen und den ganzen Monat auf einen Blick sehen: was reinkam, was rausging und wofür. Geld fühlt sich nicht mehr wie Hausaufgabe an – sondern wie Gewinnen.",
    start: "Kostenlos starten",
    how: "So funktioniert’s",
    meta: "iPhone-App · Für immer kostenlos · Kein Bank-Login nötig",
  },
  problem: {
    eyebrow: "KOMMT DIR BEKANNT VOR?",
    title: "Zahltag fühlt sich super an. Der 24. nicht.",
    items: [
      {
        h: "Das Geld ist einfach … weg.",
        p: "Kaffee, Abos, ein Abendessen durch vier geteilt. Am Monatsende weißt du ehrlich nicht, wo es geblieben ist.",
      },
      {
        h: "Du fühlst dich hinterher – und ein bisschen schuldig.",
        p: "Jede Budget-App wollte eine Stunde Tipparbeit pro Woche. Du hast sie nicht mehr geöffnet, und die Sorgen kamen zurück.",
      },
      {
        h: "Es sollte nicht so schwer sein.",
        p: "Sich um sein Geld zu kümmern sollte sich wie Fortschritt anfühlen, nicht wie Strafe. Du verdienst Kontrolle, ohne Buchhalter zu werden.",
      },
    ],
  },
  guide: {
    eyebrow: "DU BIST NICHT SCHLECHT MIT GELD",
    title:
      "Du hattest nur die falschen Werkzeuge. Wir haben das richtige gebaut.",
    body: "Wir haben PennySave gemacht, weil wir Apps satt hatten, nach denen wir uns schlechter fühlten. Also haben wir die Arbeit rausgenommen: eine Ausgabe in drei Taps, und das Bild deines Monats ist immer nur einen Blick entfernt.",
    cards: [
      [
        "Belege scannen",
        "Foto machen – Betrag, Geschäft und Kategorie füllen sich selbst aus.",
      ],
      [
        "KI-Monatsberichte",
        "Jeden Monat eine verständliche Zusammenfassung: was sich geändert hat und wohin dein Geld ging.",
      ],
      [
        "Geteilte Konten",
        "Teile mit Partner oder Mitbewohnern – offen und transparent.",
      ],
      [
        "Dein Geld, deine Sprache",
        "Euro, Pfund, Dollar, HK-Dollar – auf Englisch, Deutsch, Französisch oder Spanisch.",
      ],
    ],
  },
  plan: {
    eyebrow: "DER PLAN",
    title: "Drei Schritte zu einem entspannteren Monat",
    step: "SCHRITT",
    s1h: "In Sekunden erfasst",
    s1p: "Betrag eintippen, Kategorie wählen, fertig – kostenlos, für immer. Mit Premium fotografierst du einfach den Beleg.",
    s2h: "Überblick behalten",
    s2p: "Dein Monat in einem Bild: tägliche Ausgaben, Einnahmen, Ausgaben. Mit Premium schreibt dir die KI am Monatsende einen Bericht.",
    aiLabel: "KI-Bericht · Premium",
    taps: "Drei Taps: Betrag, Kategorie, Speichern",
    aiText:
      "Auswärts essen liegt 18 % über August – vor allem am Wochenende. Lebensmittel blieben stabil.",
    s3h: "Gemeinsam teilen",
    s3p: "Teile ein Konto mit Partner oder Mitbewohnern – alle sehen jede Zahlung und wer sie eingetragen hat.",
  },
  stakes: {
    eyebrow: "NÄCHSTER MONAT",
    title: "Zwei Wege, wie es laufen kann",
    without: "Ohne Plan",
    with: "Mit PennySave",
    bad: [
      "Zahltag kommt – und am 20. ist das Geld weg.",
      "Vergessene Abos verlängern sich still weiter.",
      "Peinliche „Wer schuldet wem?“-Gespräche nach jeder geteilten Rechnung.",
      "Dieses leise Unbehagen bei jeder Kartenzahlung.",
    ],
    good: [
      "Du weißt genau, wohin das Geld diesen Monat ging.",
      "Abos überraschen dich nicht mehr – sie stehen klar in deinem Monat.",
      "Geteilte Kosten sieht jeder, niemand muss hinterherlaufen.",
      "Geld fühlt sich wie Fortschritt an. Du sparst mit Absicht.",
    ],
  },
  pricing: {
    eyebrow: "PLÄNE",
    title: "Kostenlos starten. Premium, wenn es passt.",
    free: "Kostenlos",
    freeSub: "Für immer. Keine Karte nötig.",
    freeList: [
      "Unbegrenzte Transaktionen",
      "Konten & Kategorien",
      "Monats-Dashboard: ausgegeben, rein, raus, netto",
    ],
    premiumSub: `${FREE_TRIAL_DAYS} Tage kostenlos testen.`,
    premiumList: [
      "Alles aus Kostenlos",
      "Belege scannen",
      "Geteilte Konten",
      "KI-Monatsberichte",
    ],
    cta: "Kostenlos laden – Premium in der App testen",
    trust: [
      "Nur für iPhone",
      "Kein Bank-Login nötig",
      "Jederzeit im App Store kündbar",
    ],
    note: "Die Testphase startest du in der App. Abrechnung über den App Store, jederzeit kündbar.",
    badge: `${FREE_TRIAL_DAYS} Tage gratis`,
  },
  road: {
    eyebrow: "DEMNÄCHST",
    title: "Was als Nächstes kommt",
    sub: "PennySave wächst weiter. Daran arbeiten wir gerade.",
    soon: "Bald verfügbar",
    items: [
      {
        h: "Budgets & Warnungen",
        p: "Setze ein Limit pro Kategorie und werde benachrichtigt, bevor du es überschreitest.",
      },
      {
        h: "Frag Siri",
        p: "Ein KI-Assistent, mit dem du per Siri über deine Budgets und Ausgaben sprichst.",
      },
      {
        h: "Bankkarte verknüpfen",
        p: "Zahlungen automatisch über Apple FinanceKit. Premium, nur in den USA.",
      },
    ],
  },
  community: {
    eyebrow: "GESTALTE MIT",
    title: "Fehlt dir etwas? Sag es uns.",
    sub: "Die Roadmap oben stammt von Leuten wie dir. Erzähl uns, was PennySave für dich besser machen würde – wir lesen jede Anfrage.",
    idea: "Deine Idee",
    ideaPh: "Ich fände es toll, wenn PennySave …",
    email: "E-Mail (optional)",
    emailPh: "du@beispiel.de",
    emailNote: "Nur, wenn du eine Antwort von uns möchtest.",
    send: "Anfrage senden",
    sending: "Wird gesendet …",
    sent: "Danke! Deine Anfrage ist beim Team angekommen.",
    another: "Noch eine senden",
    error:
      "Da ist etwas schiefgelaufen. Bitte versuch es erneut oder schreib an support@pennysave.ai.",
    limit: "So viele Ideen! Bitte versuch es etwas später noch einmal.",
    tooShort: "Bitte schreib mindestens 10 Zeichen.",
    badEmail:
      "Bitte gib eine gültige E-Mail-Adresse ein oder lass das Feld leer.",
  },
  final: {
    title: "Von „Wo ist es hin?“ zu „Ich hab’s im Griff.“",
    body: "Dein erster entspannter Monat beginnt mit einem Download. Eine Ausgabe hinzufügen: drei Taps.",
    cta: "PennySave laden – kostenlos",
  },
  foot: {
    terms: "Nutzungsbedingungen",
    privacy: "Datenschutz",
    support: "Support",
  },
  ph: {
    save: "Speichern",
    all: "Alle Konten",
    meta: "3 Konten · EUR",
    month: "September",
    spent: "AUSGEGEBEN",
    partial: "1.–24. Sep.",
    daily: "Täglich · heute gestrichelt",
    payments: "46 Zahlungen",
    in: "EIN",
    out: "AUS",
    net: "NETTO",
    tx: "TRANSAKTIONEN",
    hold: "zum Bearbeiten halten",
    today: "Heute",
    yesterday: "Gestern",
    by: "Eingetragen von",
  },
  cat: {
    eat: "Auswärts essen",
    groc: "Lebensmittel",
    income: "Einkommen",
    transport: "Verkehr",
    everyday: "Alltag",
    family: "Familie",
  },
  names: {
    cafe: "Corner Café",
    market: "Frischmarkt",
    dinner: "Essen mit Lena",
    salary: "Gehalt",
    metro: "Monatskarte",
    shop: "Wocheneinkauf",
  },
};

export default de;
