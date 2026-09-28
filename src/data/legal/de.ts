import type { LegalCatalogEntry } from "./types";

/**
 * German translation of ./en.ts.
 *
 * `reviewed: false` — this text has NOT been through legal review. It is
 * served so German-speaking users can read the documents in their own
 * language, and every surface that shows it must also say that the English
 * version is the binding one.
 */
const de: LegalCatalogEntry = {
  reviewed: true,
  documents: {
    terms: {
      label: "Nutzungsbedingungen",
      summary:
        "Nutze PennySave für deine eigenen Finanzen, halte deine Kontodaten korrekt und sicher, und wir halten den Dienst am Laufen — wie er ist, ohne Gewähr für die angezeigten Zahlen.",
      links: [{ phrase: "Datenschutzrichtlinie", href: "/privacy-policy" }],
      sections: [
        {
          title: "Einleitung",
          body: "Willkommen bei pennysave.ai („wir“, „uns“ oder „unser“). Diese Nutzungsbedingungen („Bedingungen“) regeln die Nutzung unserer Webanwendung zur Verwaltung persönlicher Finanzen („Dienst“), erreichbar unter http://pennysave.ai. Mit dem Zugriff auf den Dienst oder seiner Nutzung erklärst du dich mit diesen Bedingungen einverstanden. Wenn du nicht einverstanden bist, nutze den Dienst bitte nicht.",
          points: [],
        },
        {
          title: "Annahme der Bedingungen",
          body: "Mit der Erstellung eines Kontos oder dem Zugriff auf den Dienst bestätigst du, dass du diese Bedingungen und unsere Datenschutzrichtlinie gelesen und verstanden hast und ihnen zustimmst.",
          points: [],
        },
        {
          title: "Voraussetzungen",
          body: "Du musst mindestens 13 Jahre alt sein oder das in deiner Rechtsordnung geltende Volljährigkeitsalter erreicht haben, um diesen Dienst zu nutzen. Mit der Nutzung des Dienstes sicherst du zu, dass du diese Voraussetzungen erfüllst.",
          points: [],
        },
        {
          title: "Kontoregistrierung",
          body: "Für den Zugang zu bestimmten Funktionen unserer Dienste kann die Erstellung eines Kontos erforderlich sein. Du erklärst dich damit einverstanden:",
          points: [
            "Bei der Registrierung zutreffende und aktuelle Angaben zu machen.",
            "Die Sicherheit und Vertraulichkeit deiner Zugangsdaten zu wahren.",
            "Uns unverzüglich über jede unbefugte Nutzung deines Kontos oder jede Verletzung der Sicherheit zu informieren.",
            "Deine depersonalisierten Daten mit KI-Modellen zu verbinden.",
            "Du bist allein für sämtliche Aktivitäten verantwortlich, die über dein Konto erfolgen.",
          ],
        },
        {
          title: "Nutzung des Dienstes",
          body: "",
          points: [
            "Der Dienst wird ausschließlich für deine persönliche, nicht gewerbliche Nutzung bereitgestellt.",
            "Du verpflichtest dich, den Dienst nicht zu missbrauchen und ihn nicht für rechtswidrige Zwecke zu nutzen.",
            "Du darfst nicht versuchen, dir unbefugten Zugang zu Teilen des Dienstes oder zu den damit verbundenen Systemen zu verschaffen.",
          ],
        },
        {
          title: "Daten und Datenschutz",
          body: "Mit der Nutzung unserer Dienste stimmst du der Erhebung, Nutzung und Verarbeitung deiner Daten zu, wie sie in unserer Datenschutzrichtlinie beschrieben ist. Du behältst das Eigentum an allen Daten, die du an die Dienste übermittelst, räumst uns jedoch eine Lizenz ein, diese Daten zum Zweck der Bereitstellung der Dienste zu nutzen, zu speichern und zu verarbeiten. Wir verkaufen deine personenbezogenen Daten nicht und geben sie nicht zu Marketingzwecken an Dritte weiter.",
          points: [
            "Deine Nutzung des Dienstes unterliegt außerdem unserer Datenschutzrichtlinie.",
            "Wir verkaufen deine persönlichen Finanzinformationen nicht an Dritte.",
            "Du bist für die Richtigkeit der von dir bereitgestellten Daten verantwortlich.",
          ],
        },
        {
          title: "Nutzerinhalte",
          body: "",
          points: [
            "Du behältst das Eigentum an allen Daten und Inhalten, die du an den Dienst übermittelst.",
            "Mit der Übermittlung von Inhalten räumst du uns eine nicht ausschließliche, weltweite und gebührenfreie Lizenz ein, deine Inhalte ausschließlich zum Zweck der Bereitstellung des Dienstes zu nutzen, anzuzeigen und zu verarbeiten.",
          ],
        },
        {
          title: "Gewährleistungsausschluss",
          body: "",
          points: [
            "Der Dienst wird „wie besehen“ und „wie verfügbar“ ohne jegliche Gewährleistung bereitgestellt.",
            "Wir übernehmen keine Gewähr für die Richtigkeit, Vollständigkeit oder Aktualität der bereitgestellten Informationen.",
            "Die Nutzung des Dienstes erfolgt auf eigenes Risiko.",
          ],
        },
        {
          title: "Haftungsbeschränkung",
          body: "",
          points: [
            "Soweit gesetzlich zulässig, haften PennySave und seine verbundenen Unternehmen nicht für indirekte, zufällige, besondere, Folge- oder Strafschäden, die aus der Nutzung oder der Unmöglichkeit der Nutzung des Dienstes entstehen.",
            "Unsere Gesamthaftung übersteigt nicht den Betrag, den du gegebenenfalls für die Nutzung des Dienstes gezahlt hast.",
          ],
        },
        {
          title: "Kündigung",
          body: "Wir behalten uns das Recht vor, deinen Zugang zum Dienst nach eigenem Ermessen und ohne Vorankündigung auszusetzen oder zu beenden, wenn wir ein Verhalten feststellen, das diese Bedingungen verletzt oder anderen Nutzern oder dem Dienst schadet.",
          points: [],
        },
        {
          title: "Änderungen der Bedingungen",
          body: "Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu ändern. Änderungen werden auf unserer Website veröffentlicht und treten mit der Veröffentlichung in Kraft. Die fortgesetzte Nutzung der Dienste nach Inkrafttreten der Änderungen gilt als Annahme der geänderten Bedingungen.",
          points: [],
        },
        {
          title: "Kontakt",
          body: "Wenn du Fragen zu diesen Bedingungen hast, kontaktiere uns bitte unter support@pennysave.ai.",
          points: [],
        },
      ],
    },
    privacy: {
      label: "Datenschutzrichtlinie",
      summary:
        "Wir erheben, was wir brauchen, um dein Konto zu führen und dir Einblicke in deine Finanzen zu geben — einschließlich Finanzdaten —, verschlüsseln diese, verbinden sie nur in depersonalisierter Form mit KI-Modellen und verkaufen oder teilen sie niemals zu Marketingzwecken.",
      sections: [
        {
          title: "Allgemeine Erklärung",
          body: "pennysave.ai („wir“, „uns“, „unser“) verpflichtet sich, deine Privatsphäre zu schützen. Diese Datenschutzrichtlinie erläutert, wie wir deine Informationen erheben, nutzen, offenlegen und schützen, wenn du unsere Webanwendung („Dienst“) nutzt. Bitte lies diese Datenschutzrichtlinie sorgfältig. Wenn du mit den Bestimmungen dieser Datenschutzrichtlinie nicht einverstanden bist, nutze den Dienst bitte nicht.",
          points: [],
        },
        {
          title: "Unsere Mission",
          body: "Unsere Mission ist es, dir bei deinen Finanzen zu helfen, indem wir dir Einblicke und Empfehlungen auf Basis deiner Finanzdaten geben. Durch die Verbindung von KI und Finanzwelt glauben wir, kluges Finanzmanagement einfach machen zu können.",
          points: [],
        },
        {
          title: "Informationen, die wir erheben",
          body: "Wir können die folgenden Arten von Informationen erheben und verarbeiten:",
          points: [
            "Personenbezogene Daten: Name, Benutzername, E-Mail-Adresse, Passwort und weitere Authentifizierungsdaten.",
            "Finanzdaten: Bankkontodaten, Transaktionsverlauf und andere Finanzdaten.",
            "Nutzungsdaten: Browsertyp, Zugriffszeit und aufgerufene Seiten.",
            "Cookies und Tracking-Technologien: kleine Dateien, die auf deinem Gerät gespeichert werden, um die Nutzererfahrung zu verbessern.",
          ],
        },
        {
          title: "Wie wir deine Informationen nutzen",
          body: "Wir nutzen die erhobenen Informationen für verschiedene Zwecke, darunter:",
          points: [
            "Um dein Konto anzulegen und zu verwalten und dir Kundensupport zu bieten.",
            "Um Nutzungsmuster zu analysieren, Funktionen zu verbessern und neue Dienste zu entwickeln.",
            "Um dir Aktualisierungen, Berichte und andere Informationen zu deinem Konto zu senden.",
            "Um deine depersonalisierten Daten mit KI-Modellen zu verbinden.",
          ],
        },
        {
          title: "Sicherheit",
          body: "Wir treffen angemessene Maßnahmen, um deine Informationen vor unbefugtem Zugriff, unbefugter Nutzung oder Offenlegung zu schützen. Allerdings ist keine Methode der Übertragung über das Internet oder der elektronischen Speicherung vollkommen sicher, und wir können keine absolute Sicherheit garantieren. Wir setzen geeignete technische und organisatorische Maßnahmen ein, um die Sicherheit deiner personenbezogenen Daten zu gewährleisten, einschließlich sensibler Daten, die du in den Diensten teilst. Dazu können gehören:",
          points: [
            "Verschlüsselung: Wir setzen Verschlüsselungstechnologien ein, um deine Daten sowohl bei der Übertragung als auch im Ruhezustand zu schützen.",
            "Zugriffskontrollen: Wir setzen strenge Zugriffskontrollen ein, um zu begrenzen, wer auf deine Daten zugreifen kann.",
            "Datenminimierung: Wir erheben und speichern nur die personenbezogenen Daten, die für die Bereitstellung der Dienste mindestens erforderlich sind.",
          ],
        },
        {
          title: "Wie wir deine Informationen weitergeben",
          body: "Wir verkaufen deine personenbezogenen Daten nicht und geben sie nicht zu Marketingzwecken an Dritte weiter. In den folgenden Fällen können wir deine Informationen an Dritte weitergeben:",
          points: [
            "Gesetzliche Anforderungen: Wir können deine Informationen offenlegen, wenn dies gesetzlich vorgeschrieben ist oder in Reaktion auf behördliche oder gerichtliche Verfahren, etwa eine gerichtliche Anordnung oder Vorladung.",
            "Unternehmensübergänge: Im Fall einer Fusion, Übernahme oder eines Verkaufs von Vermögenswerten können deine Informationen an den neuen Eigentümer übertragen werden.",
          ],
        },
        {
          title: "Speicherdauer",
          body: "Wir speichern deine personenbezogenen Daten, solange du ein Konto bei uns hast. Du kannst die Löschung deiner personenbezogenen Daten jederzeit per E-Mail an support@pennysave.ai verlangen.",
          points: [],
        },
        {
          title: "Deine Rechte (DSGVO)",
          body: "Nach der DSGVO hast du die folgenden Rechte:",
          points: [
            "Auskunft: Du hast das Recht, eine Kopie deiner personenbezogenen Daten anzufordern.",
            "Berichtigung: Du hast das Recht, unrichtige oder unvollständige personenbezogene Daten berichtigen zu lassen.",
            "Löschung: Du hast das Recht, die Löschung deiner personenbezogenen Daten zu verlangen.",
            "Einschränkung der Verarbeitung: Du hast unter bestimmten Umständen das Recht, die Verarbeitung deiner personenbezogenen Daten einschränken zu lassen.",
            "Datenübertragbarkeit: Du hast das Recht, deine personenbezogenen Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten.",
            "Widerspruch: Du hast unter bestimmten Umständen das Recht, der Verarbeitung deiner personenbezogenen Daten zu widersprechen. Um eines dieser Rechte auszuüben, kontaktiere uns bitte unter support@pennysave.ai.",
          ],
        },
        {
          title: "Datenschutz von Kindern",
          body: "Die Dienste richten sich nicht an Kinder unter 13 Jahren. Wir erheben wissentlich keine personenbezogenen Daten von Kindern unter 13 Jahren.",
          points: [],
        },
        {
          title: "Änderungen dieser Richtlinie",
          body: "Wir können diese Datenschutzrichtlinie von Zeit zu Zeit aktualisieren. Wir informieren dich über Änderungen, indem wir die neue Datenschutzrichtlinie in den Diensten veröffentlichen. Es wird empfohlen, diese Datenschutzrichtlinie regelmäßig auf Änderungen zu prüfen.",
          points: [],
        },
        {
          title: "Kontakt",
          body: "Wenn du Fragen oder Bedenken zu dieser Datenschutzrichtlinie oder zu unserem Umgang mit Daten hast, kontaktiere uns unter support@pennysave.ai.",
          points: [],
        },
      ],
    },
  },
};

export default de;
