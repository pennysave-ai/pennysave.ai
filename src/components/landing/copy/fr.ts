import type { Copy } from "../i18n";
import { FREE_TRIAL_DAYS } from "./shared";

/** French landing-page copy (mirrors ./en.ts). */
const fr: Copy = {
  nav: {
    why: "Pourquoi",
    how: "Comment ça marche",
    plans: "Offres",
    getApp: "Télécharger",
    language: "Langue",
    skip: "Aller au contenu",
    opensStore: "(ouvre l’App Store)",
  },
  hero: {
    badge: "Le budget sur iPhone, sans effort",
    h1a: "Sachez où va chaque centime.",
    h1b: "Sans tableur.",
    sub: "Ajoutez une dépense en trois touches et voyez tout votre mois d’un coup d’œil : ce qui est entré, ce qui est sorti et où tout est parti. L’argent n’est plus une corvée — c’est une victoire.",
    start: "Commencer gratuitement",
    how: "Comment ça marche",
    meta: "Appli iPhone · Gratuit pour toujours · Aucune connexion bancaire",
  },
  problem: {
    eyebrow: "ÇA VOUS PARLE ?",
    title: "Le jour de paie, c’est génial. Le 24, beaucoup moins.",
    items: [
      {
        h: "L’argent file… tout simplement.",
        p: "Des cafés, des abonnements, un dîner partagé à quatre. En fin de mois, impossible de dire où il est passé.",
      },
      {
        h: "Vous vous sentez en retard — et un peu coupable.",
        p: "Chaque appli de budget exigeait une heure de saisie par semaine. Vous avez arrêté de l’ouvrir, et l’inquiétude est revenue.",
      },
      {
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
        "Euro, livre, dollar, dollar de Hong Kong — en anglais, allemand, français ou espagnol.",
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
    taps: "Trois touches : montant, catégorie, enregistrer",
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
      "Les abonnements ne vous prennent plus par surprise : ils sont là, dans votre mois.",
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
    premiumSub: `Essayez-le gratuitement pendant ${FREE_TRIAL_DAYS} jours.`,
    premiumList: [
      "Tout ce qu’offre Gratuit",
      "Lecture des tickets",
      "Comptes partagés",
      "Rapports mensuels par IA",
    ],
    cta: "Télécharger gratuitement — essayer Premium dans l’appli",
    trust: [
      "iPhone uniquement",
      "Aucune connexion bancaire",
      "Résiliable à tout moment dans l’App Store",
    ],
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
  community: {
    eyebrow: "CONSTRUISONS-LE ENSEMBLE",
    title: "Il vous manque quelque chose ? Dites-le-nous.",
    sub: "La feuille de route ci-dessus vient de personnes comme vous. Dites-nous ce qui rendrait PennySave plus utile pour vous — nous lisons chaque demande.",
    idea: "Votre idée",
    ideaPh: "J’aimerais que PennySave puisse…",
    email: "E-mail (facultatif)",
    emailPh: "vous@exemple.fr",
    emailNote: "Seulement si vous souhaitez une réponse.",
    send: "Envoyer la demande",
    sending: "Envoi…",
    sent: "Merci ! Votre demande a bien été transmise à l’équipe.",
    another: "En envoyer une autre",
    error:
      "Une erreur s’est produite. Réessayez ou écrivez à support@pennysave.ai.",
    limit: "Que d’idées ! Merci de réessayer un peu plus tard.",
    tooShort: "Écrivez au moins 10 caractères, s’il vous plaît.",
    badEmail: "Saisissez une adresse e-mail valide, ou laissez le champ vide.",
  },
  final: {
    title: "De « où est-il passé ? » à « je gère ».",
    body: "Votre premier mois serein commence par un téléchargement. Ajouter une dépense : trois touches.",
    cta: "Obtenir PennySave — gratuit",
  },
  foot: {
    terms: "Conditions",
    privacy: "Confidentialité",
    support: "Assistance",
  },
  ph: {
    save: "Enregistrer",
    all: "Tous les comptes",
    meta: "3 comptes · EUR",
    month: "Septembre",
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
};

export default fr;
