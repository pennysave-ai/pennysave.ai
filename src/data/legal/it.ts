import type { LegalCatalogEntry } from "./types";

/**
 * Italian translation of ./en.ts.
 *
 * `reviewed: false` — this translation has not been through legal review yet,
 * so every surface showing it must say that the English version governs. Flip
 * it to `true` only once the text has actually been reviewed.
 */
const it: LegalCatalogEntry = {
  reviewed: false,
  documents: {
    terms: {
      label: "Termini di servizio",
      summary:
        "Usa PennySave per le tue finanze personali, mantieni i dati del tuo account corretti e al sicuro, e noi manterremo il servizio attivo — così com’è, senza garanzie sulle cifre che ti mostra.",
      links: [{ phrase: "Informativa sulla privacy", href: "/privacy-policy" }],
      sections: [
        {
          title: "Introduzione",
          body: "Benvenuto su pennysave.ai («noi» o «nostro»). I presenti Termini di servizio («Termini») regolano l’uso della nostra applicazione web per la gestione delle finanze personali («Servizio»), accessibile all’indirizzo http://pennysave.ai. Accedendo al Servizio o utilizzandolo, accetti di essere vincolato dai presenti Termini. Se non li accetti, ti preghiamo di non utilizzare il Servizio.",
          points: [],
        },
        {
          title: "Accettazione dei Termini",
          body: "Creando un account o accedendo al Servizio, confermi di aver letto, compreso e accettato i presenti Termini e la nostra Informativa sulla privacy.",
          points: [],
        },
        {
          title: "Requisiti di età",
          body: "Per utilizzare il Servizio devi avere almeno 13 anni o la maggiore età prevista nella tua giurisdizione. Utilizzando il Servizio, dichiari e garantisci di soddisfare tali requisiti.",
          points: [],
        },
        {
          title: "Registrazione dell’account",
          body: "Per accedere ad alcune funzionalità dei nostri Servizi potrebbe esserti richiesto di creare un account. Accetti di:",
          points: [
            "Fornire informazioni corrette e aggiornate durante la procedura di registrazione.",
            "Mantenere la sicurezza e la riservatezza delle credenziali del tuo account.",
            "Informarci immediatamente di qualsiasi uso non autorizzato del tuo account o violazione della sicurezza.",
            "Collegare i tuoi dati resi anonimi a modelli di IA.",
            "Sei l’unico responsabile di tutte le attività svolte tramite il tuo account.",
          ],
        },
        {
          title: "Uso del Servizio",
          body: "",
          points: [
            "Il Servizio è fornito esclusivamente per uso personale e non commerciale.",
            "Accetti di non fare un uso improprio del Servizio né di utilizzarlo per scopi illeciti.",
            "Non puoi tentare di ottenere l’accesso non autorizzato a qualsiasi parte del Servizio o ai sistemi a esso collegati.",
          ],
        },
        {
          title: "Dati e privacy",
          body: "Utilizzando i nostri Servizi, accetti la raccolta, l’uso e il trattamento dei tuoi dati come descritto nella nostra Informativa sulla privacy. Mantieni la titolarità di tutti i dati che invii ai Servizi, ma ci concedi una licenza per utilizzarli, conservarli e trattarli al fine di fornire i Servizi. Non vendiamo né condividiamo i tuoi dati personali con terzi per i loro scopi di marketing.",
          points: [
            "Il tuo uso del Servizio è regolato anche dalla nostra Informativa sulla privacy.",
            "Non vendiamo a terzi le tue informazioni finanziarie personali.",
            "Sei responsabile dell’esattezza dei dati che fornisci.",
          ],
        },
        {
          title: "Contenuti dell’utente",
          body: "",
          points: [
            "Mantieni la titolarità di tutti i dati o contenuti che invii al Servizio.",
            "Inviando contenuti, ci concedi una licenza non esclusiva, valida in tutto il mondo e gratuita per utilizzare, visualizzare e trattare i tuoi contenuti al solo scopo di fornire il Servizio.",
          ],
        },
        {
          title: "Esclusione di garanzie",
          body: "",
          points: [
            "Il Servizio è fornito «così com’è» e «come disponibile», senza garanzie di alcun tipo.",
            "Non garantiamo l’esattezza, la completezza o la tempestività delle informazioni fornite.",
            "L’uso del Servizio avviene a tuo rischio.",
          ],
        },
        {
          title: "Limitazione di responsabilità",
          body: "",
          points: [
            "Nella misura massima consentita dalla legge, PennySave e le sue affiliate non saranno responsabili di alcun danno indiretto, incidentale, speciale, consequenziale o punitivo derivante dall’uso o dall’impossibilità di utilizzare il Servizio.",
            "La nostra responsabilità complessiva non potrà superare l’importo da te eventualmente pagato per utilizzare il Servizio.",
          ],
        },
        {
          title: "Cessazione",
          body: "Ci riserviamo il diritto di sospendere o interrompere il tuo accesso al Servizio a nostra esclusiva discrezione, senza preavviso, per comportamenti che riteniamo violino i presenti Termini o siano dannosi per altri utenti o per il Servizio.",
          points: [],
        },
        {
          title: "Modifiche ai Termini",
          body: "Ci riserviamo il diritto di modificare i presenti Termini in qualsiasi momento. Eventuali modifiche saranno pubblicate sul nostro sito web e diventeranno efficaci al momento della pubblicazione. L’uso continuato dei Servizi dopo l’entrata in vigore delle modifiche costituisce accettazione dei Termini modificati.",
          points: [],
        },
        {
          title: "Contatti",
          body: "Per qualsiasi domanda sui presenti Termini, contattaci all’indirizzo support@pennysave.ai.",
          points: [],
        },
      ],
    },
    privacy: {
      label: "Informativa sulla privacy",
      summary:
        "Raccogliamo ciò che serve per gestire il tuo account e offrirti analisi finanziarie — compresi i dati finanziari —, li crittografiamo, li colleghiamo a modelli di IA solo in forma anonima e non li vendiamo né li condividiamo mai per scopi di marketing.",
      sections: [
        {
          title: "Dichiarazione generale",
          body: "pennysave.ai («noi», «nostro») si impegna a proteggere la tua privacy. La presente Informativa sulla privacy spiega come raccogliamo, utilizziamo, divulghiamo e proteggiamo le tue informazioni quando utilizzi la nostra applicazione web («Servizio»). Ti invitiamo a leggerla attentamente. Se non accetti i termini della presente Informativa sulla privacy, ti preghiamo di non utilizzare il Servizio.",
          points: [],
        },
        {
          title: "La nostra missione",
          body: "La nostra missione è aiutarti con le tue finanze offrendoti analisi e consigli basati sui tuoi dati finanziari. Unendo il mondo dell’IA e quello della finanza, crediamo di poter rendere semplice una gestione intelligente del denaro.",
          points: [],
        },
        {
          title: "Informazioni che raccogliamo",
          body: "Possiamo raccogliere e trattare i seguenti tipi di informazioni:",
          points: [
            "Informazioni personali: nome, nome utente, indirizzo email, password e altri dati di autenticazione.",
            "Informazioni finanziarie: dati del conto bancario, cronologia delle transazioni e altri dati finanziari.",
            "Dati di utilizzo: tipo di browser, orario di accesso e pagine visualizzate.",
            "Cookie e tecnologie di tracciamento: piccoli file di dati memorizzati sul tuo dispositivo per migliorare l’esperienza d’uso.",
          ],
        },
        {
          title: "Come utilizziamo le tue informazioni",
          body: "Utilizziamo le informazioni raccolte per diversi scopi, tra cui:",
          points: [
            "Creare e gestire il tuo account e fornire assistenza clienti.",
            "Analizzare le modalità di utilizzo, migliorare le funzionalità e sviluppare nuovi servizi.",
            "Inviarti aggiornamenti, report e altre informazioni relative al tuo account.",
            "Collegare i tuoi dati resi anonimi a modelli di IA.",
          ],
        },
        {
          title: "Sicurezza",
          body: "Adottiamo misure ragionevoli per proteggere le tue informazioni da accessi, usi o divulgazioni non autorizzati. Tuttavia, nessun metodo di trasmissione su internet o di archiviazione elettronica è completamente sicuro e non possiamo garantire una sicurezza assoluta. Adottiamo misure tecniche e organizzative adeguate per proteggere i tuoi dati personali, compresi i dati sensibili che decidi di condividere nei Servizi. Tali misure possono includere:",
          points: [
            "Crittografia: utilizziamo tecnologie di crittografia per proteggere i tuoi dati sia in transito sia a riposo.",
            "Controlli di accesso: applichiamo rigorosi controlli di accesso per limitare chi può accedere ai tuoi dati.",
            "Minimizzazione dei dati: raccogliamo e conserviamo solo i dati personali strettamente necessari per fornire i Servizi.",
          ],
        },
        {
          title: "Come condividiamo le tue informazioni",
          body: "Non vendiamo né condividiamo i tuoi dati personali con terzi per i loro scopi di marketing. Possiamo condividere le tue informazioni con terzi nei seguenti casi:",
          points: [
            "Obblighi di legge: possiamo divulgare le tue informazioni se richiesto dalla legge o in risposta a procedimenti legali, come un’ordinanza del tribunale o una citazione.",
            "Trasferimenti aziendali: in caso di fusione, acquisizione o cessione di beni, le tue informazioni potrebbero essere trasferite al nuovo proprietario.",
          ],
        },
        {
          title: "Conservazione dei dati",
          body: "Conserviamo i tuoi dati personali per tutto il tempo in cui hai un account presso di noi. Puoi richiedere la cancellazione dei tuoi dati personali in qualsiasi momento scrivendo a support@pennysave.ai.",
          points: [],
        },
        {
          title: "I tuoi diritti (GDPR)",
          body: "Ai sensi del GDPR, hai i seguenti diritti:",
          points: [
            "Accesso: hai il diritto di richiedere una copia dei tuoi dati personali.",
            "Rettifica: hai il diritto di correggere dati personali inesatti o incompleti.",
            "Cancellazione: hai il diritto di richiedere la cancellazione dei tuoi dati personali.",
            "Limitazione del trattamento: hai il diritto di limitare il trattamento dei tuoi dati personali in determinate circostanze.",
            "Portabilità dei dati: hai il diritto di ricevere i tuoi dati personali in un formato strutturato, di uso comune e leggibile da dispositivo automatico.",
            "Opposizione: hai il diritto di opporti al trattamento dei tuoi dati personali in determinate circostanze. Per esercitare uno qualsiasi di questi diritti, contattaci all’indirizzo support@pennysave.ai.",
          ],
        },
        {
          title: "Privacy dei minori",
          body: "I Servizi non sono destinati ai minori di 13 anni. Non raccogliamo consapevolmente informazioni personali da minori di 13 anni.",
          points: [],
        },
        {
          title: "Modifiche alla presente Informativa",
          body: "Potremmo aggiornare periodicamente la presente Informativa sulla privacy. Ti informeremo di eventuali modifiche pubblicando la nuova Informativa sulla privacy nei Servizi. Ti consigliamo di consultarla periodicamente per verificare eventuali modifiche.",
          points: [],
        },
        {
          title: "Contatti",
          body: "Per qualsiasi domanda o dubbio sulla presente Informativa sulla privacy o sulle nostre pratiche in materia di dati, contattaci all’indirizzo support@pennysave.ai.",
          points: [],
        },
      ],
    },
  },
};

export default it;
