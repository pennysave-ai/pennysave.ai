import type { Copy } from "../i18n";
import { FREE_TRIAL_DAYS } from "./shared";

/** Spanish landing-page copy (mirrors ./en.ts). */
const es: Copy = {
  nav: {
    why: "Por qué",
    how: "Cómo funciona",
    plans: "Planes",
    getApp: "Descargar",
    language: "Idioma",
    skip: "Saltar al contenido",
    opensStore: "(abre el App Store)",
  },
  hero: {
    badge: "Presupuestos en iPhone, sin esfuerzo",
    h1a: "Sabe a dónde va cada céntimo.",
    h1b: "Sin hojas de cálculo.",
    sub: "Añade un gasto en tres toques y ve todo tu mes de un vistazo: lo que entró, lo que salió y a dónde fue. El dinero deja de sentirse como deberes y empieza a sentirse como ganar.",
    start: "Empieza gratis",
    how: "Cómo funciona",
    meta: "App para iPhone · Gratis para siempre · Sin conectar tu banco",
  },
  problem: {
    eyebrow: "¿TE SUENA?",
    title: "El día de cobro es genial. El 24, no tanto.",
    items: [
      {
        h: "El dinero simplemente… se va.",
        p: "Cafés, suscripciones, una cena dividida entre cuatro. A fin de mes, sinceramente, no sabes a dónde fue.",
      },
      {
        h: "Te sientes atrasado, y un poco culpable.",
        p: "Cada app de presupuestos que probaste pedía una hora de escribir cada semana. Dejaste de abrirla y la preocupación volvió.",
      },
      {
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
        "Euro, libra, dólar, dólar de Hong Kong, en inglés, alemán, francés o español.",
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
    taps: "Tres toques: importe, categoría, guardar",
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
      "Las suscripciones ya no te pillan por sorpresa: están ahí, en tu mes.",
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
    premiumSub: `Pruébalo gratis durante ${FREE_TRIAL_DAYS} días.`,
    premiumList: [
      "Todo lo del plan Gratis",
      "Lectura de tickets",
      "Cuentas compartidas",
      "Informes mensuales con IA",
    ],
    cta: "Descarga gratis y prueba Premium en la app",
    trust: [
      "Solo para iPhone",
      "Sin conectar tu banco",
      "Cancela cuando quieras en el App Store",
    ],
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
  community: {
    eyebrow: "AYÚDANOS A MEJORAR",
    title: "¿Echas algo de menos? Cuéntanoslo.",
    sub: "La hoja de ruta de arriba salió de personas como tú. Cuéntanos qué haría que PennySave te funcionara mejor: leemos cada propuesta.",
    idea: "Tu idea",
    ideaPh: "Me encantaría que PennySave pudiera…",
    email: "Email (opcional)",
    emailPh: "tu@ejemplo.com",
    emailNote: "Solo si quieres que te respondamos.",
    send: "Enviar propuesta",
    sending: "Enviando…",
    sent: "¡Gracias! Tu propuesta ya va de camino al equipo.",
    another: "Enviar otra",
    error:
      "Algo ha fallado. Inténtalo de nuevo o escribe a support@pennysave.ai.",
    limit: "¡Cuántas ideas! Vuelve a intentarlo un poco más tarde.",
    tooShort: "Escribe al menos 10 caracteres.",
    badEmail: "Introduce un correo válido o deja el campo vacío.",
  },
  final: {
    title: "De «¿a dónde se fue?» a «lo tengo controlado».",
    body: "Tu primer mes tranquilo empieza con una descarga. Añadir un gasto: tres toques.",
    cta: "Consigue PennySave, es gratis",
  },
  foot: { terms: "Términos", privacy: "Privacidad", support: "Soporte" },
  ph: {
    save: "Guardar",
    all: "Todas las cuentas",
    meta: "3 cuentas · EUR",
    month: "Septiembre",
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
};

export default es;
