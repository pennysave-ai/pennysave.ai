import type { LegalCatalogEntry } from "./types";

/**
 * French translation of ./en.ts.
 *
 * `reviewed: true` — this translation has been through legal review. When
 * ./en.ts changes, it is stale until it is updated and re-reviewed; set
 * `reviewed` back to false until then.
 */
const fr: LegalCatalogEntry = {
  reviewed: true,
  documents: {
    terms: {
      label: "Conditions d’Utilisation",
      summary:
        "Utilisez PennySave pour vos propres finances, gardez les informations de votre compte exactes et sécurisées, et nous maintiendrons le service en fonctionnement — en l’état, sans garantie sur les chiffres affichés.",
      links: [
        { phrase: "Politique de Confidentialité", href: "/privacy-policy" },
      ],
      sections: [
        {
          title: "Introduction",
          body: "Bienvenue sur pennysave.ai (« nous », « notre »). Les présentes Conditions d’Utilisation (« Conditions ») régissent votre utilisation de notre application web de gestion de finances personnelles (« Service »), accessible à l’adresse http://pennysave.ai. En accédant au Service ou en l’utilisant, vous acceptez d’être lié par les présentes Conditions. Si vous n’êtes pas d’accord, veuillez ne pas utiliser notre Service.",
          points: [],
        },
        {
          title: "Acceptation des Conditions",
          body: "En créant un compte ou en accédant au Service, vous confirmez avoir lu, compris et accepté les présentes Conditions ainsi que notre Politique de Confidentialité.",
          points: [],
        },
        {
          title: "Conditions d’éligibilité",
          body: "Vous devez avoir au moins 13 ans ou l’âge de la majorité dans votre juridiction pour utiliser ce Service. En utilisant le Service, vous déclarez et garantissez que vous remplissez ces conditions.",
          points: [],
        },
        {
          title: "Création de compte",
          body: "Pour accéder à certaines fonctionnalités de nos Services, vous pouvez être amené à créer un compte. Vous acceptez de :",
          points: [
            "Fournir des informations exactes et à jour lors de la création du compte.",
            "Préserver la sécurité et la confidentialité de vos identifiants.",
            "Nous informer immédiatement de toute utilisation non autorisée de votre compte ou de toute faille de sécurité.",
            "Connecter vos données dépersonnalisées à des modèles d’IA.",
            "Vous êtes seul responsable de toute activité effectuée depuis votre compte.",
          ],
        },
        {
          title: "Utilisation du Service",
          body: "",
          points: [
            "Le Service est fourni pour votre usage personnel et non commercial uniquement.",
            "Vous vous engagez à ne pas détourner le Service ni à l’utiliser à des fins illicites.",
            "Vous ne devez pas tenter d’obtenir un accès non autorisé à une partie quelconque du Service ou aux systèmes qui y sont liés.",
          ],
        },
        {
          title: "Données et confidentialité",
          body: "En utilisant nos Services, vous acceptez la collecte, l’utilisation et le traitement de vos données tels que décrits dans notre Politique de Confidentialité. Vous conservez la propriété de toutes les données que vous transmettez aux Services, mais vous nous accordez une licence pour utiliser, stocker et traiter ces données aux fins de la fourniture des Services. Nous ne vendons ni ne partageons vos données personnelles avec des tiers à des fins de marketing.",
          points: [
            "Votre utilisation du Service est également régie par notre Politique de Confidentialité.",
            "Nous ne vendons pas vos informations financières personnelles à des tiers.",
            "Vous êtes responsable de l’exactitude des données que vous fournissez.",
          ],
        },
        {
          title: "Contenu de l’utilisateur",
          body: "",
          points: [
            "Vous conservez la propriété des données ou contenus que vous transmettez au Service.",
            "En transmettant du contenu, vous nous accordez une licence non exclusive, mondiale et gratuite pour utiliser, afficher et traiter votre contenu aux seules fins de la fourniture du Service.",
          ],
        },
        {
          title: "Exclusion de garanties",
          body: "",
          points: [
            "Le Service est fourni « en l’état » et « selon disponibilité », sans garantie d’aucune sorte.",
            "Nous ne garantissons ni l’exactitude, ni l’exhaustivité, ni l’actualité des informations fournies.",
            "Vous utilisez le Service à vos propres risques.",
          ],
        },
        {
          title: "Limitation de responsabilité",
          body: "",
          points: [
            "Dans toute la mesure permise par la loi, PennySave et ses sociétés affiliées ne sauraient être tenues responsables de dommages indirects, accessoires, spéciaux, consécutifs ou punitifs résultant de votre utilisation ou de votre impossibilité d’utiliser le Service.",
            "Notre responsabilité totale n’excédera pas le montant que vous avez, le cas échéant, payé pour utiliser le Service.",
          ],
        },
        {
          title: "Résiliation",
          body: "Nous nous réservons le droit de suspendre ou de résilier votre accès au Service, à notre seule discrétion et sans préavis, en cas de comportement que nous estimons contraire aux présentes Conditions ou préjudiciable aux autres utilisateurs ou au Service.",
          points: [],
        },
        {
          title: "Modifications des Conditions",
          body: "Nous nous réservons le droit de modifier les présentes Conditions à tout moment. Toute modification sera publiée sur notre site web et prendra effet dès sa publication. La poursuite de votre utilisation des Services après l’entrée en vigueur des modifications vaut acceptation des Conditions modifiées.",
          points: [],
        },
        {
          title: "Nous contacter",
          body: "Pour toute question concernant les présentes Conditions, contactez-nous à l’adresse support@pennysave.ai.",
          points: [],
        },
      ],
    },
    privacy: {
      label: "Politique de Confidentialité",
      summary:
        "Nous collectons ce qui est nécessaire pour gérer votre compte et vous fournir des analyses financières — y compris des données financières —, nous les chiffrons, ne les connectons aux modèles d’IA que sous forme dépersonnalisée, et ne les vendons ni ne les partageons jamais à des fins de marketing.",
      sections: [
        {
          title: "Déclaration générale",
          body: "pennysave.ai (« nous », « notre ») s’engage à protéger votre vie privée. La présente Politique de Confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre application web (« Service »). Veuillez lire attentivement cette Politique de Confidentialité. Si vous n’acceptez pas ses termes, veuillez ne pas utiliser le Service.",
          points: [],
        },
        {
          title: "Notre mission",
          body: "Notre mission est de vous aider dans vos finances en vous fournissant des analyses et des recommandations fondées sur vos données financières. En réunissant le monde de l’IA et celui de la finance, nous pensons pouvoir rendre simple la finance intelligente.",
          points: [],
        },
        {
          title: "Informations que nous collectons",
          body: "Nous pouvons collecter et traiter les types d’informations suivants :",
          points: [
            "Informations personnelles : nom, nom d’utilisateur, adresse e-mail, mot de passe et autres données d’authentification.",
            "Informations financières : coordonnées bancaires, historique des transactions et autres données financières.",
            "Données d’utilisation : type de navigateur, heure d’accès et pages consultées.",
            "Cookies et technologies de suivi : petits fichiers stockés sur votre appareil afin d’améliorer l’expérience utilisateur.",
          ],
        },
        {
          title: "Comment nous utilisons vos informations",
          body: "Nous utilisons les informations collectées à différentes fins, notamment :",
          points: [
            "Créer et gérer votre compte et vous fournir une assistance client.",
            "Analyser les usages, améliorer les fonctionnalités et développer de nouveaux services.",
            "Vous envoyer des mises à jour, des rapports et d’autres informations relatives à votre compte.",
            "Connecter vos données dépersonnalisées à des modèles d’IA.",
          ],
        },
        {
          title: "Sécurité",
          body: "Nous prenons des mesures raisonnables pour protéger vos informations contre tout accès, usage ou divulgation non autorisés. Toutefois, aucune méthode de transmission sur internet ou de stockage électronique n’est totalement sûre, et nous ne pouvons garantir une sécurité absolue. Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour assurer la sécurité de vos données personnelles, y compris les données sensibles que vous choisissez de partager dans les Services. Ces mesures peuvent inclure :",
          points: [
            "Chiffrement : nous employons des technologies de chiffrement pour protéger vos données, en transit comme au repos.",
            "Contrôles d’accès : nous appliquons des contrôles d’accès stricts afin de limiter qui peut accéder à vos données.",
            "Minimisation des données : nous ne collectons et ne conservons que les données personnelles strictement nécessaires à la fourniture des Services.",
          ],
        },
        {
          title: "Comment nous partageons vos informations",
          body: "Nous ne vendons ni ne partageons vos données personnelles avec des tiers à des fins de marketing. Nous pouvons partager vos informations avec des tiers dans les cas suivants :",
          points: [
            "Obligations légales : nous pouvons divulguer vos informations si la loi l’exige ou en réponse à une procédure judiciaire, telle qu’une décision de justice ou une injonction.",
            "Transferts d’entreprise : en cas de fusion, d’acquisition ou de cession d’actifs, vos informations peuvent être transférées au nouveau propriétaire.",
          ],
        },
        {
          title: "Conservation des données",
          body: "Nous conservons vos données personnelles tant que vous disposez d’un compte chez nous. Vous pouvez demander la suppression de vos données personnelles à tout moment en écrivant à support@pennysave.ai.",
          points: [],
        },
        {
          title: "Vos droits (RGPD)",
          body: "En vertu du RGPD, vous disposez des droits suivants :",
          points: [
            "Accès : vous avez le droit de demander une copie de vos données personnelles.",
            "Rectification : vous avez le droit de faire corriger des données personnelles inexactes ou incomplètes.",
            "Effacement : vous avez le droit de demander la suppression de vos données personnelles.",
            "Limitation du traitement : vous avez le droit de demander la limitation du traitement de vos données personnelles dans certains cas.",
            "Portabilité des données : vous avez le droit de recevoir vos données personnelles dans un format structuré, couramment utilisé et lisible par machine.",
            "Opposition : vous avez le droit de vous opposer au traitement de vos données personnelles dans certains cas. Pour exercer l’un de ces droits, contactez-nous à l’adresse support@pennysave.ai.",
          ],
        },
        {
          title: "Protection des mineurs",
          body: "Les Services ne sont pas destinés aux enfants de moins de 13 ans. Nous ne collectons pas sciemment d’informations personnelles concernant des enfants de moins de 13 ans.",
          points: [],
        },
        {
          title: "Modifications de la présente Politique",
          body: "Nous pouvons mettre à jour la présente Politique de Confidentialité de temps à autre. Nous vous informerons de toute modification en publiant la nouvelle Politique de Confidentialité dans les Services. Il vous est conseillé de consulter régulièrement la présente Politique de Confidentialité.",
          points: [],
        },
        {
          title: "Nous contacter",
          body: "Pour toute question ou préoccupation concernant la présente Politique de Confidentialité ou nos pratiques en matière de données, contactez-nous à l’adresse support@pennysave.ai.",
          points: [],
        },
      ],
    },
  },
};

export default fr;
