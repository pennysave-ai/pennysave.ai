// Copy for the landing page, mirrored from the "Landing Page" design.
const FREE_TRIAL_DAYS = 30;
export const I18N = {
  en: {
    nav: {
      why: "Why",
      how: "How it works",
      plans: "Plans",
      getApp: "Get the app",
    },
    hero: {
      badge: "Budgeting for iPhone, made effortless",
      h1a: "Know where every penny goes.",
      h1b: "Without the spreadsheet.",
      sub: "Add a payment in three taps and see your whole month at a glance: what came in, what went out, and where it all went. Money stops feeling like homework and starts feeling like winning.",
      start: "Start free",
      how: "See how it works",
      meta: `Free plan forever · Premium free for ${FREE_TRIAL_DAYS} days · English, Deutsch, Français`,
    },
    problem: {
      eyebrow: "SOUND FAMILIAR?",
      title: "Payday feels great. The 24th doesn’t.",
      items: [
        {
          n: "01",
          h: "The money just… goes.",
          p: "Coffees, subscriptions, a dinner split four ways. By the end of the month you honestly can’t say where it went.",
        },
        {
          n: "02",
          h: "You feel behind — and a bit guilty.",
          p: "Every budgeting app you tried wanted an hour of typing each week. You stopped opening it, and the worry came back.",
        },
        {
          n: "03",
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
          "Euro, pound, dollar, HK dollar — in English, German or French.",
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
        "Forgotten subscriptions show up — and get cancelled.",
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
      freeCta: "Download free",
      premiumSub: `Try it free for ${FREE_TRIAL_DAYS} days.`,
      premiumList: [
        "Everything in Free",
        "Receipt recognition",
        "Shared accounts",
        "AI-generated monthly reports",
      ],
      premiumCta: "Download & try Premium free",
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
    final: {
      title: "From “where did it go?” to “I’ve got this.”",
      body: "Your first calm month starts with one tap. It takes about ten seconds.",
      cta: "Get PennySave — it’s free",
    },
    foot: { terms: "Terms", privacy: "Privacy", support: "Support" },
    ph: {
      all: "All accounts",
      meta: "3 accounts · EUR",
      month: "September 2026",
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
  },
  de: {
    nav: {
      why: "Warum",
      how: "So funktioniert’s",
      plans: "Pläne",
      getApp: "App laden",
    },
    hero: {
      badge: "Budgetplanung fürs iPhone – ganz mühelos",
      h1a: "Wisse, wohin jeder Cent geht.",
      h1b: "Ganz ohne Tabelle.",
      sub: "Eine Ausgabe in drei Taps erfassen und den ganzen Monat auf einen Blick sehen: was reinkam, was rausging und wofür. Geld fühlt sich nicht mehr wie Hausaufgabe an – sondern wie Gewinnen.",
      start: "Kostenlos starten",
      how: "So funktioniert’s",
      meta: `Für immer kostenlos · Premium ${FREE_TRIAL_DAYS} Tage gratis · English, Deutsch, Français`,
    },
    problem: {
      eyebrow: "KOMMT DIR BEKANNT VOR?",
      title: "Zahltag fühlt sich super an. Der 24. nicht.",
      items: [
        {
          n: "01",
          h: "Das Geld ist einfach … weg.",
          p: "Kaffee, Abos, ein Abendessen durch vier geteilt. Am Monatsende weißt du ehrlich nicht, wo es geblieben ist.",
        },
        {
          n: "02",
          h: "Du fühlst dich hinterher – und ein bisschen schuldig.",
          p: "Jede Budget-App wollte eine Stunde Tipparbeit pro Woche. Du hast sie nicht mehr geöffnet, und die Sorgen kamen zurück.",
        },
        {
          n: "03",
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
          "Euro, Pfund, Dollar, HK-Dollar – auf Englisch, Deutsch oder Französisch.",
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
        "Vergessene Abos fallen auf – und werden gekündigt.",
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
      freeCta: "Kostenlos laden",
      premiumSub: `${FREE_TRIAL_DAYS} Tage kostenlos testen.`,
      premiumList: [
        "Alles aus Kostenlos",
        "Belege scannen",
        "Geteilte Konten",
        "KI-Monatsberichte",
      ],
      premiumCta: "Laden & Premium gratis testen",
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
    final: {
      title: "Von „Wo ist es hin?“ zu „Ich hab’s im Griff.“",
      body: "Dein erster entspannter Monat beginnt mit einem Tap. Das dauert etwa zehn Sekunden.",
      cta: "PennySave laden – kostenlos",
    },
    foot: {
      terms: "Nutzungsbedingungen",
      privacy: "Datenschutz",
      support: "Support",
    },
    ph: {
      all: "Alle Konten",
      meta: "3 Konten · EUR",
      month: "September 2026",
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
  },
  fr: {
    nav: {
      why: "Pourquoi",
      how: "Comment ça marche",
      plans: "Offres",
      getApp: "Télécharger",
    },
    hero: {
      badge: "Le budget sur iPhone, sans effort",
      h1a: "Sachez où va chaque centime.",
      h1b: "Sans tableur.",
      sub: "Ajoutez une dépense en trois touches et voyez tout votre mois d’un coup d’œil : ce qui est entré, ce qui est sorti et où tout est parti. L’argent n’est plus une corvée — c’est une victoire.",
      start: "Commencer gratuitement",
      how: "Comment ça marche",
      meta: `Gratuit pour toujours · Premium offert ${FREE_TRIAL_DAYS} jours · English, Deutsch, Français`,
    },
    problem: {
      eyebrow: "ÇA VOUS PARLE ?",
      title: "Le jour de paie, c’est génial. Le 24, beaucoup moins.",
      items: [
        {
          n: "01",
          h: "L’argent file… tout simplement.",
          p: "Des cafés, des abonnements, un dîner partagé à quatre. En fin de mois, impossible de dire où il est passé.",
        },
        {
          n: "02",
          h: "Vous vous sentez en retard — et un peu coupable.",
          p: "Chaque appli de budget exigeait une heure de saisie par semaine. Vous avez arrêté de l’ouvrir, et l’inquiétude est revenue.",
        },
        {
          n: "03",
          h: "Ça ne devrait pas être si difficile.",
          p: "Gérer son argent devrait ressembler à un progrès, pas à une punition. Vous méritez d’avoir le contrôle sans devenir comptable.",
        },
      ],
    },
    guide: {
      eyebrow: "VOUS N’ÊTES PAS NUL AVEC L’ARGENT",
      title: "Vous aviez juste les mauvais outils. Nous avons créé le bon.",
      body: "Nous avons créé PennySave parce que nous en avions assez des applis qui nous faisaient culpabiliser. Alors nous avons supprimé la corvée : une dépense en trois touches, et l’image de votre mois toujours à portée de regard.",
      cards: [
        [
          "Lecture des tickets",
          "Prenez une photo — montant, magasin et catégorie se remplissent tout seuls.",
        ],
        [
          "Rapports mensuels par IA",
          "Chaque mois, un résumé clair de ce qui a changé et de l’endroit où est parti votre argent.",
        ],
        [
          "Comptes partagés",
          "Partagez avec votre partenaire ou vos colocs, en toute transparence.",
        ],
        [
          "Votre argent, votre langue",
          "Euro, livre, dollar, dollar de Hong Kong — en anglais, allemand ou français.",
        ],
      ],
    },
    plan: {
      eyebrow: "LE PLAN",
      title: "Trois étapes vers un mois plus serein",
      step: "ÉTAPE",
      s1h: "Ajoutez en quelques secondes",
      s1p: "Tapez le montant, choisissez une catégorie, c’est fait — gratuit, pour toujours. Avec Premium, photographiez le ticket et tout se remplit.",
      s2h: "Visualisez",
      s2p: "Votre mois en une image : dépenses quotidiennes, entrées, sorties. Avec Premium, l’IA vous rédige un rapport à la fin de chaque mois.",
      aiLabel: "Rapport IA · Premium",
      aiText:
        "Les restaurants sont en hausse de 18 % par rapport à août — surtout le week-end. Les courses sont stables.",
      s3h: "Partagez",
      s3p: "Partagez un compte avec votre partenaire ou vos colocs — chacun voit chaque paiement et qui l’a ajouté.",
    },
    stakes: {
      eyebrow: "LE MOIS PROCHAIN",
      title: "Deux scénarios possibles",
      without: "Sans plan",
      with: "Avec PennySave",
      bad: [
        "La paie tombe, et le 20 il ne reste plus rien.",
        "Des abonnements oubliés se renouvellent en silence.",
        "Des discussions gênantes « qui doit quoi ? » après chaque addition partagée.",
        "Cette petite angoisse à chaque paiement par carte.",
      ],
      good: [
        "Vous savez exactement où est passé l’argent ce mois-ci.",
        "Les abonnements oubliés apparaissent — et sont résiliés.",
        "Les dépenses partagées sont visibles par tous, sans relances.",
        "L’argent devient un progrès. Vous épargnez volontairement.",
      ],
    },
    pricing: {
      eyebrow: "OFFRES",
      title: "Commencez gratuitement. Passez à Premium quand vous voulez.",
      free: "Gratuit",
      freeSub: "Pour toujours. Sans carte bancaire.",
      freeList: [
        "Transactions illimitées",
        "Comptes et catégories",
        "Tableau de bord mensuel : dépensé, entrées, sorties, net",
      ],
      freeCta: "Télécharger gratuitement",
      premiumSub: `Essayez-le gratuitement pendant ${FREE_TRIAL_DAYS} jours.`,
      premiumList: [
        "Tout ce qu’offre Gratuit",
        "Lecture des tickets",
        "Comptes partagés",
        "Rapports mensuels par IA",
      ],
      premiumCta: "Télécharger et essayer Premium",
      note: "L’essai démarre dans l’appli. Facturation via l’App Store, résiliable à tout moment.",
      badge: `${FREE_TRIAL_DAYS} jours offerts`,
    },
    road: {
      eyebrow: "BIENTÔT",
      title: "Ce qui arrive ensuite",
      sub: "PennySave continue de grandir. Voici ce que nous préparons.",
      soon: "Bientôt disponible",
      items: [
        {
          h: "Budgets et alertes",
          p: "Fixez une limite par catégorie et soyez prévenu avant de la dépasser.",
        },
        {
          h: "Parlez à Siri",
          p: "Un assistant IA avec qui parler de vos budgets et dépenses, directement via Siri.",
        },
        {
          h: "Liaison de carte bancaire",
          p: "Paiements importés automatiquement via Apple FinanceKit. Premium, États-Unis uniquement.",
        },
      ],
    },
    final: {
      title: "De « où est-il passé ? » à « je gère ».",
      body: "Votre premier mois serein commence par une touche. Environ dix secondes.",
      cta: "Obtenir PennySave — gratuit",
    },
    foot: {
      terms: "Conditions",
      privacy: "Confidentialité",
      support: "Assistance",
    },
    ph: {
      all: "Tous les comptes",
      meta: "3 comptes · EUR",
      month: "Septembre 2026",
      spent: "DÉPENSÉ",
      partial: "1–24 sept.",
      daily: "Quotidien · aujourd’hui en pointillé",
      payments: "46 paiements",
      in: "ENTRÉES",
      out: "SORTIES",
      net: "NET",
      tx: "TRANSACTIONS",
      hold: "maintenir pour modifier",
      today: "Aujourd’hui",
      yesterday: "Hier",
      by: "Ajouté par",
    },
    cat: {
      eat: "Restaurants",
      groc: "Courses",
      income: "Revenus",
      transport: "Transports",
      everyday: "Quotidien",
      family: "Famille",
    },
    names: {
      cafe: "Corner Café",
      market: "Marché frais",
      dinner: "Dîner avec Lena",
      salary: "Salaire",
      metro: "Pass métro",
      shop: "Courses de la semaine",
    },
  },
  es: {
    nav: {
      why: "Por qué",
      how: "Cómo funciona",
      plans: "Planes",
      getApp: "Descargar",
    },
    hero: {
      badge: "Presupuestos en iPhone, sin esfuerzo",
      h1a: "Sabe a dónde va cada céntimo.",
      h1b: "Sin hojas de cálculo.",
      sub: "Añade un gasto en tres toques y ve todo tu mes de un vistazo: lo que entró, lo que salió y a dónde fue. El dinero deja de sentirse como deberes y empieza a sentirse como ganar.",
      start: "Empieza gratis",
      how: "Cómo funciona",
      meta: `Plan gratuito para siempre · Premium gratis ${FREE_TRIAL_DAYS} días · English, Deutsch, Français`,
    },
    problem: {
      eyebrow: "¿TE SUENA?",
      title: "El día de cobro es genial. El 24, no tanto.",
      items: [
        {
          n: "01",
          h: "El dinero simplemente… se va.",
          p: "Cafés, suscripciones, una cena dividida entre cuatro. A fin de mes, sinceramente, no sabes a dónde fue.",
        },
        {
          n: "02",
          h: "Te sientes atrasado, y un poco culpable.",
          p: "Cada app de presupuestos que probaste pedía una hora de escribir cada semana. Dejaste de abrirla y la preocupación volvió.",
        },
        {
          n: "03",
          h: "No debería ser tan difícil.",
          p: "Cuidar tu dinero debería sentirse como un avance, no como un castigo. Mereces tener el control sin convertirte en contable.",
        },
      ],
    },
    guide: {
      eyebrow: "NO ERES MALO CON EL DINERO",
      title:
        "Solo tenías las herramientas equivocadas. Nosotros creamos la correcta.",
      body: "Creamos PennySave porque estábamos cansados de apps que nos hacían sentir peor. Así que quitamos el trabajo: un gasto son tres toques, y la imagen de tu mes siempre está a un vistazo.",
      cards: [
        [
          "Lectura de tickets",
          "Haz una foto: importe, tienda y categoría se rellenan solos.",
        ],
        [
          "Informes mensuales con IA",
          "Cada mes, un resumen claro de lo que cambió y a dónde fue tu dinero.",
        ],
        [
          "Cuentas compartidas",
          "Comparte con tu pareja o compañeros de piso, con total transparencia.",
        ],
        [
          "Tu dinero, tu idioma",
          "Euro, libra, dólar, dólar de Hong Kong, en inglés, alemán o francés.",
        ],
      ],
    },
    plan: {
      eyebrow: "EL PLAN",
      title: "Tres pasos hacia un mes más tranquilo",
      step: "PASO",
      s1h: "Añádelo en segundos",
      s1p: "Escribe el importe, elige una categoría y listo: gratis, para siempre. Con Premium, fotografía el ticket y se rellena solo.",
      s2h: "Visualízalo",
      s2p: "Tu mes en una imagen: gasto diario, lo que entró, lo que salió. Con Premium, la IA te escribe un informe al final de cada mes.",
      aiLabel: "Informe IA · Premium",
      aiText:
        "Comer fuera sube un 18 % respecto a agosto, sobre todo los fines de semana. La compra se mantiene estable.",
      s3h: "Compártelo",
      s3p: "Comparte una cuenta con tu pareja o compañeros de piso: todos ven cada pago y quién lo añadió.",
    },
    stakes: {
      eyebrow: "EL PRÓXIMO MES",
      title: "Dos maneras de que salga",
      without: "Sin un plan",
      with: "Con PennySave",
      bad: [
        "Llega el día de cobro y el 20 ya no queda nada.",
        "Suscripciones olvidadas se renuevan en silencio.",
        "Incómodas charlas de «¿quién debe qué?» tras cada cuenta compartida.",
        "Esa preocupación de fondo cada vez que pagas con tarjeta.",
      ],
      good: [
        "Sabes exactamente a dónde fue el dinero este mes.",
        "Las suscripciones olvidadas salen a la luz, y se cancelan.",
        "Los gastos compartidos los ve todo el mundo, sin perseguir a nadie.",
        "El dinero se siente como un avance. Empiezas a ahorrar a propósito.",
      ],
    },
    pricing: {
      eyebrow: "PLANES",
      title: "Empieza gratis. Pásate a Premium cuando quieras.",
      free: "Gratis",
      freeSub: "Para siempre. Sin tarjeta.",
      freeList: [
        "Transacciones ilimitadas",
        "Cuentas y categorías",
        "Panel mensual: gastado, entradas, salidas, neto",
      ],
      freeCta: "Descargar gratis",
      premiumSub: `Pruébalo gratis durante ${FREE_TRIAL_DAYS} días.`,
      premiumList: [
        "Todo lo del plan Gratis",
        "Lectura de tickets",
        "Cuentas compartidas",
        "Informes mensuales con IA",
      ],
      premiumCta: "Descargar y probar Premium",
      note: "Inicia la prueba desde la app. Se factura a través del App Store, cancela cuando quieras.",
      badge: `${FREE_TRIAL_DAYS} días gratis`,
    },
    road: {
      eyebrow: "PRÓXIMAMENTE",
      title: "Lo que viene",
      sub: "PennySave sigue creciendo. Esto es lo que estamos construyendo.",
      soon: "Muy pronto",
      items: [
        {
          h: "Presupuestos y alertas",
          p: "Pon un límite por categoría y recibe un aviso antes de pasarte.",
        },
        {
          h: "Habla con Siri",
          p: "Un asistente con IA al que preguntar por tus presupuestos y gastos, directamente con Siri.",
        },
        {
          h: "Vincular tarjeta bancaria",
          p: "Pagos importados automáticamente con Apple FinanceKit. Premium, solo en EE. UU.",
        },
      ],
    },
    final: {
      title: "De «¿a dónde se fue?» a «lo tengo controlado».",
      body: "Tu primer mes tranquilo empieza con un toque. Tarda unos diez segundos.",
      cta: "Consigue PennySave, es gratis",
    },
    foot: { terms: "Términos", privacy: "Privacidad", support: "Soporte" },
    ph: {
      all: "Todas las cuentas",
      meta: "3 cuentas · EUR",
      month: "Septiembre 2026",
      spent: "GASTADO",
      partial: "1–24 sept.",
      daily: "Diario · hoy en discontinua",
      payments: "46 pagos",
      in: "ENTRA",
      out: "SALE",
      net: "NETO",
      tx: "TRANSACCIONES",
      hold: "mantén pulsado para editar",
      today: "Hoy",
      yesterday: "Ayer",
      by: "Añadido por",
    },
    cat: {
      eat: "Comer fuera",
      groc: "Supermercado",
      income: "Ingresos",
      transport: "Transporte",
      everyday: "Diario",
      family: "Familia",
    },
    names: {
      cafe: "Corner Café",
      market: "Mercado Fresco",
      dinner: "Cena con Lena",
      salary: "Nómina",
      metro: "Abono de metro",
      shop: "Compra semanal",
    },
  },
};

export type Lang = keyof typeof I18N;
export type Copy = (typeof I18N)["en"];

export const LANGS: { code: Lang; name: string }[] = [
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
];

export const LOCALE: Record<Lang, string> = {
  en: "en-IE",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
};

/** Labels around the legal documents; the documents themselves live in `@/data/legal`. */
export const LEGAL_COPY: Record<
  Lang,
  {
    eyebrow: string;
    tabs: string;
    effective: string;
    minRead: string;
    sections: string;
    plain: string;
    plainNote: string;
    questions: string;
    unreviewed: string;
    readEnglish: string;
  }
> = {
  en: {
    eyebrow: "LEGAL",
    tabs: "Legal documents",
    effective: "Effective",
    minRead: "min read",
    sections: "sections",
    plain: "IN PLAIN ENGLISH",
    plainNote:
      "A summary, not the agreement. The full text below is what binds.",
    questions: "Questions about this? Write to",
    unreviewed: "",
    readEnglish: "",
  },
  de: {
    eyebrow: "RECHTLICHES",
    tabs: "Rechtliche Dokumente",
    effective: "Gültig ab",
    minRead: "Min. Lesezeit",
    sections: "Abschnitte",
    plain: "EINFACH ERKLÄRT",
    plainNote:
      "Eine Zusammenfassung, nicht die Vereinbarung. Verbindlich ist der vollständige Text unten.",
    questions: "Fragen dazu? Schreib an",
    unreviewed:
      "Diese Übersetzung wurde noch nicht rechtlich geprüft. Verbindlich ist die englische Fassung.",
    readEnglish: "Auf Englisch lesen",
  },
  fr: {
    eyebrow: "MENTIONS LÉGALES",
    tabs: "Documents juridiques",
    effective: "En vigueur le",
    minRead: "min de lecture",
    sections: "sections",
    plain: "EN BREF",
    plainNote:
      "Un résumé, pas l’accord. Seul le texte complet ci-dessous fait foi.",
    questions: "Une question ? Écrivez à",
    unreviewed:
      "Cette traduction n’a pas encore été vérifiée juridiquement. Seule la version anglaise fait foi.",
    readEnglish: "Lire en anglais",
  },
  es: {
    eyebrow: "LEGAL",
    tabs: "Documentos legales",
    effective: "Vigente desde",
    minRead: "min de lectura",
    sections: "secciones",
    plain: "EN POCAS PALABRAS",
    plainNote:
      "Un resumen, no el acuerdo. Lo que vincula es el texto completo de abajo.",
    questions: "¿Preguntas? Escribe a",
    unreviewed:
      "Esta traducción aún no ha pasado una revisión legal. La versión en inglés es la vinculante.",
    readEnglish: "Leer en inglés",
  },
};
