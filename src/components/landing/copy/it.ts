import type { Copy } from "../i18n";
import { FREE_TRIAL_DAYS } from "./shared";

/** Italian landing-page copy (mirrors ./en.ts). */
const it: Copy = {
  nav: {
    why: "Perché",
    how: "Come funziona",
    plans: "Piani",
    getApp: "Scarica l’app",
    language: "Lingua",
    skip: "Vai al contenuto",
    opensStore: "(apre l’App Store)",
  },
  hero: {
    badge: "Il budget su iPhone, senza fatica",
    h1a: "Sappi dove va ogni centesimo.",
    h1b: "Senza fogli di calcolo.",
    sub: "Aggiungi una spesa in tre tocchi e vedi tutto il tuo mese a colpo d’occhio: cosa è entrato, cosa è uscito e dove è finito. I soldi smettono di sembrare compiti a casa e iniziano a sembrare una vittoria.",
    start: "Inizia gratis",
    how: "Scopri come funziona",
    meta: "App per iPhone · Piano gratuito per sempre · Nessun accesso alla banca",
  },
  problem: {
    eyebrow: "TI SUONA FAMILIARE?",
    title: "Il giorno di paga è bellissimo. Il 24, un po’ meno.",
    items: [
      {
        h: "I soldi semplicemente… spariscono.",
        p: "Caffè, abbonamenti, una cena divisa in quattro. A fine mese, sinceramente, non sai dire dove sono finiti.",
      },
      {
        h: "Ti senti indietro, e un po’ in colpa.",
        p: "Ogni app per il budget che hai provato voleva un’ora di digitazione a settimana. Hai smesso di aprirla e la preoccupazione è tornata.",
      },
      {
        h: "Non dovrebbe essere così difficile.",
        p: "Prenderti cura dei tuoi soldi dovrebbe sembrare un progresso, non una punizione. Meriti di avere il controllo senza diventare un commercialista.",
      },
    ],
  },
  guide: {
    eyebrow: "NON SEI NEGATO CON I SOLDI",
    title:
      "Avevi solo gli strumenti sbagliati. Noi abbiamo creato quello giusto.",
    body: "Abbiamo creato PennySave perché eravamo stanchi di app che ci facevano sentire peggio. Così abbiamo tolto la fatica: una spesa richiede tre tocchi e il quadro del tuo mese è sempre a portata di sguardo.",
    cards: [
      [
        "Budget che ti seguono",
        "Un limite settimanale, mensile o annuale, totale o per categoria, con quello che resta sempre in vista. Con Premium, un avviso prima di sforare.",
      ],
      [
        "Widget",
        "Il tuo mese e quanto resta nei tuoi budget, nella schermata Home o di blocco, con un pulsante per aggiungere una spesa senza aprire l’app.",
      ],
      [
        "Lettura degli scontrini",
        "Scatta una foto: importo, negozio e categoria si compilano da soli.",
      ],
      [
        "Report mensili con IA",
        "Ogni mese, un riepilogo chiaro di cosa è cambiato e di dove sono finiti i tuoi soldi.",
      ],
      [
        "Conti condivisi",
        "Condividi con il partner o i coinquilini, in totale trasparenza.",
      ],
      [
        "I tuoi soldi, la tua lingua",
        "Euro, sterlina, dollaro, dollaro di Hong Kong, in inglese, tedesco, francese, spagnolo o italiano.",
      ],
    ],
  },
  plan: {
    eyebrow: "IL PIANO",
    title: "Tre passi verso un mese più sereno",
    step: "PASSO",
    s1h: "Aggiungila in pochi secondi",
    s1p: "Scrivi l’importo, scegli una categoria, fatto: gratis, per sempre. Oppure aggiungila direttamente da un widget nella schermata Home. Con Premium, fotografa lo scontrino e si compila da solo.",
    s2h: "Guardala",
    s2p: "Il tuo mese in un’immagine: spesa giornaliera, cosa è entrato, cosa è uscito e quanto resta in ogni budget. Con Premium, l’IA ti scrive un report alla fine di ogni mese.",
    aiLabel: "Report IA · Premium",
    taps: "Tre tocchi: importo, categoria, salva",
    aiText:
      "Mangiare fuori è salito del 18 % rispetto ad agosto, soprattutto nei weekend. La spesa è rimasta stabile.",
    s3h: "Condividila",
    s3p: "Condividi un conto con il partner o i coinquilini: tutti vedono ogni pagamento e chi l’ha aggiunto.",
  },
  stakes: {
    eyebrow: "IL PROSSIMO MESE",
    title: "Due modi in cui può andare",
    without: "Senza un piano",
    with: "Con PennySave",
    bad: [
      "Arriva lo stipendio e il 20 non è rimasto niente.",
      "Abbonamenti dimenticati si rinnovano in silenzio.",
      "Imbarazzanti discussioni su «chi deve cosa?» dopo ogni conto condiviso.",
      "Quella preoccupazione di fondo ogni volta che paghi con la carta.",
    ],
    good: [
      "Sai esattamente dove sono finiti i soldi questo mese, e quanto resta nel budget.",
      "Gli abbonamenti non ti colgono più di sorpresa: sono lì, nel tuo mese.",
      "Le spese condivise sono visibili a tutti, senza rincorrere nessuno.",
      "I soldi diventano un progresso. Inizi a risparmiare di proposito.",
    ],
  },
  pricing: {
    eyebrow: "PIANI",
    title: "Inizia gratis. Passa a Premium quando ti convince.",
    free: "Gratis",
    freeSub: "Per sempre. Nessuna carta richiesta.",
    freeList: [
      "Transazioni illimitate",
      "Conti e categorie",
      "Dashboard mensile: speso, entrate, uscite, netto",
      "Budget settimanali, mensili, trimestrali o annuali",
      "Widget per la schermata Home e di blocco",
    ],
    premiumSub: `Provalo gratis per ${FREE_TRIAL_DAYS} giorni.`,
    premiumList: [
      "Tutto quello del piano Gratis",
      "Lettura degli scontrini",
      "Conti condivisi",
      "Report mensili generati dall’IA",
      "Avvisi di budget prima di sforare",
    ],
    cta: "Scarica gratis e prova Premium nell’app",
    trust: [
      "Solo per iPhone",
      "Nessun accesso alla banca",
      "Disdici quando vuoi dall’App Store",
    ],
    note: "Avvia la prova dall’app. Addebito tramite l’App Store, disdici quando vuoi.",
    badge: `${FREE_TRIAL_DAYS} giorni gratis`,
  },
  road: {
    eyebrow: "IN ARRIVO",
    title: "Cosa arriva dopo",
    sub: "PennySave continua a crescere. Ecco a cosa stiamo lavorando.",
    soon: "Presto disponibile",
    items: [
      {
        h: "Parla con Siri",
        p: "Un assistente IA a cui chiedere dei tuoi budget e delle tue spese, direttamente con Siri.",
      },
      {
        h: "Collegamento della carta",
        p: "Pagamenti importati automaticamente con Apple FinanceKit. Premium, solo negli Stati Uniti.",
      },
    ],
  },
  community: {
    eyebrow: "AIUTACI A MIGLIORARE",
    title: "Ti manca qualcosa? Diccelo.",
    sub: "La roadmap qui sopra è nata da persone come te. Raccontaci cosa renderebbe PennySave più utile per te: leggiamo ogni richiesta.",
    idea: "La tua idea",
    ideaPh: "Mi piacerebbe che PennySave potesse…",
    email: "Email (facoltativa)",
    emailPh: "tu@esempio.com",
    emailNote: "Solo se vuoi ricevere una risposta.",
    send: "Invia richiesta",
    sending: "Invio in corso…",
    sent: "Grazie! La tua richiesta è in viaggio verso il team.",
    another: "Inviane un’altra",
    error: "Qualcosa è andato storto. Riprova o scrivi a support@pennysave.ai.",
    limit: "Quante idee! Riprova tra un po’.",
    tooShort: "Scrivi almeno 10 caratteri.",
    badEmail: "Inserisci un indirizzo email valido o lascia il campo vuoto.",
  },
  final: {
    title: "Da «dove sono finiti?» a «ho tutto sotto controllo».",
    body: "Il tuo primo mese sereno inizia con un download. Aggiungere una spesa: tre tocchi.",
    cta: "Scarica PennySave, è gratis",
  },
  foot: { terms: "Termini", privacy: "Privacy", support: "Assistenza" },
  ph: {
    save: "Salva",
    all: "Tutti i conti",
    meta: "3 conti · EUR",
    month: "Settembre",
    spent: "SPESO",
    partial: "1–24 set",
    daily: "Giornaliero · oggi tratteggiato",
    payments: "46 pagamenti",
    in: "ENTRATE",
    out: "USCITE",
    net: "NETTO",
    tx: "TRANSAZIONI",
    hold: "tieni premuto per modificare",
    today: "Oggi",
    yesterday: "Ieri",
    by: "Aggiunto da",
  },
  cat: {
    eat: "Mangiare fuori",
    groc: "Spesa",
    income: "Entrate",
    transport: "Trasporti",
    everyday: "Quotidiano",
    family: "Famiglia",
  },
  names: {
    cafe: "Corner Café",
    market: "Mercato Fresco",
    dinner: "Cena con Lena",
    salary: "Stipendio",
    metro: "Abbonamento metro",
    shop: "Spesa settimanale",
  },
};

export default it;
