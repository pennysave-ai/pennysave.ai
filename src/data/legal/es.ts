import type { LegalCatalogEntry } from "./types";

/**
 * Spanish translation of ./en.ts.
 *
 * `reviewed: false` — this text has NOT been through legal review. It is
 * served so Spanish-speaking users can read the documents in their own
 * language, and every surface that shows it must also say that the English
 * version is the binding one.
 */
const es: LegalCatalogEntry = {
  reviewed: true,
  documents: {
    terms: {
      label: "Términos del Servicio",
      summary:
        "Usa PennySave para tus propias finanzas, mantén los datos de tu cuenta exactos y seguros, y nosotros mantendremos el servicio en funcionamiento — tal cual, sin garantías sobre las cifras que muestra.",
      links: [{ phrase: "Política de Privacidad", href: "/privacy-policy" }],
      sections: [
        {
          title: "Introducción",
          body: "Bienvenido a pennysave.ai («nosotros» o «nuestro»). Estos Términos del Servicio («Términos») rigen el uso de nuestra aplicación web de gestión de finanzas personales («Servicio»), accesible en http://pennysave.ai. Al acceder o utilizar nuestro Servicio, aceptas quedar vinculado por estos Términos. Si no estás de acuerdo, por favor no utilices nuestro Servicio.",
          points: [],
        },
        {
          title: "Aceptación de los Términos",
          body: "Al crear una cuenta o acceder al Servicio, confirmas que has leído, entendido y aceptado estos Términos y nuestra Política de Privacidad.",
          points: [],
        },
        {
          title: "Requisitos de edad",
          body: "Debes tener al menos 13 años o la mayoría de edad en tu jurisdicción para utilizar este Servicio. Al utilizar el Servicio, declaras y garantizas que cumples estos requisitos.",
          points: [],
        },
        {
          title: "Registro de cuenta",
          body: "Para acceder a determinadas funciones de nuestros Servicios, es posible que debas crear una cuenta. Aceptas:",
          points: [
            "Proporcionar información exacta y actualizada durante el proceso de registro.",
            "Mantener la seguridad y la confidencialidad de las credenciales de tu cuenta.",
            "Notificarnos de inmediato cualquier uso no autorizado de tu cuenta o cualquier fallo de seguridad.",
            "Conectar tus datos despersonalizados con modelos de IA.",
            "Eres el único responsable de toda la actividad que se produzca en tu cuenta.",
          ],
        },
        {
          title: "Uso del Servicio",
          body: "",
          points: [
            "El Servicio se ofrece únicamente para tu uso personal y no comercial.",
            "Aceptas no hacer un uso indebido del Servicio ni utilizarlo con fines ilícitos.",
            "No puedes intentar obtener acceso no autorizado a ninguna parte del Servicio ni a los sistemas relacionados con él.",
          ],
        },
        {
          title: "Datos y privacidad",
          body: "Al utilizar nuestros Servicios, aceptas la recogida, el uso y el tratamiento de tus datos tal como se describe en nuestra Política de Privacidad. Conservas la titularidad de todos los datos que envías a los Servicios, pero nos concedes una licencia para usar, almacenar y tratar dichos datos con el fin de prestar los Servicios. No vendemos ni compartimos tus datos personales con terceros para sus fines de marketing.",
          points: [
            "El uso que hagas del Servicio también se rige por nuestra Política de Privacidad.",
            "No vendemos tu información financiera personal a terceros.",
            "Eres responsable de la exactitud de los datos que proporcionas.",
          ],
        },
        {
          title: "Contenido del usuario",
          body: "",
          points: [
            "Conservas la titularidad de cualquier dato o contenido que envíes al Servicio.",
            "Al enviar contenido, nos concedes una licencia no exclusiva, mundial y libre de regalías para usar, mostrar y tratar tu contenido con el único fin de prestar el Servicio.",
          ],
        },
        {
          title: "Exención de garantías",
          body: "",
          points: [
            "El Servicio se presta «tal cual» y «según disponibilidad», sin garantías de ningún tipo.",
            "No garantizamos la exactitud, la integridad ni la actualidad de la información proporcionada.",
            "El uso que hagas del Servicio es por tu cuenta y riesgo.",
          ],
        },
        {
          title: "Limitación de responsabilidad",
          body: "",
          points: [
            "En la máxima medida permitida por la ley, PennySave y sus filiales no serán responsables de daños indirectos, incidentales, especiales, consecuentes o punitivos derivados del uso o de la imposibilidad de uso del Servicio.",
            "Nuestra responsabilidad total no excederá el importe que hayas pagado por utilizar el Servicio, si lo hubiera.",
          ],
        },
        {
          title: "Terminación",
          body: "Nos reservamos el derecho de suspender o cancelar tu acceso al Servicio a nuestra entera discreción, sin previo aviso, por conductas que consideremos que infringen estos Términos o que resultan perjudiciales para otros usuarios o para el Servicio.",
          points: [],
        },
        {
          title: "Cambios en los Términos",
          body: "Nos reservamos el derecho de modificar estos Términos en cualquier momento. Cualquier cambio se publicará en nuestro sitio web y entrará en vigor en el momento de su publicación. El uso continuado de los Servicios después de que los cambios entren en vigor constituye tu aceptación de los Términos modificados.",
          points: [],
        },
        {
          title: "Contacto",
          body: "Si tienes alguna pregunta sobre estos Términos, contáctanos en support@pennysave.ai.",
          points: [],
        },
      ],
    },
    privacy: {
      label: "Política de Privacidad",
      summary:
        "Recogemos lo necesario para gestionar tu cuenta y ofrecerte información sobre tus finanzas — incluidos datos financieros —, lo ciframos, lo conectamos con modelos de IA solo de forma despersonalizada y nunca lo vendemos ni lo compartimos con fines de marketing.",
      sections: [
        {
          title: "Declaración general",
          body: "pennysave.ai («nosotros» o «nuestro») se compromete a proteger tu privacidad. Esta Política de Privacidad explica cómo recogemos, usamos, divulgamos y protegemos tu información cuando utilizas nuestra aplicación web («Servicio»). Por favor, lee atentamente esta Política de Privacidad. Si no estás de acuerdo con sus condiciones, no utilices el Servicio.",
          points: [],
        },
        {
          title: "Nuestra misión",
          body: "Nuestra misión es ayudarte con tus finanzas ofreciéndote información y recomendaciones basadas en tus datos financieros. Combinando el mundo de la IA y el de las finanzas, creemos que podemos hacer sencillas las finanzas inteligentes.",
          points: [],
        },
        {
          title: "Información que recogemos",
          body: "Podemos recoger y tratar los siguientes tipos de información:",
          points: [
            "Información personal: nombre, nombre de usuario, dirección de correo electrónico, contraseña y otros datos de autenticación.",
            "Información financiera: datos de cuentas bancarias, historial de transacciones y otros datos financieros.",
            "Datos de uso: tipo de navegador, hora de acceso y páginas visitadas.",
            "Cookies y tecnologías de seguimiento: pequeños archivos de datos almacenados en tu dispositivo para mejorar la experiencia de usuario.",
          ],
        },
        {
          title: "Cómo usamos tu información",
          body: "Usamos la información que recogemos con distintos fines, entre ellos los siguientes:",
          points: [
            "Crear y gestionar tu cuenta y ofrecerte atención al cliente.",
            "Analizar patrones de uso, mejorar funciones y desarrollar nuevos servicios.",
            "Enviarte actualizaciones, informes y otra información relacionada con tu cuenta.",
            "Conectar tus datos despersonalizados con modelos de IA.",
          ],
        },
        {
          title: "Seguridad",
          body: "Adoptamos medidas razonables para proteger tu información frente al acceso, uso o divulgación no autorizados. No obstante, ningún método de transmisión por internet o de almacenamiento electrónico es completamente seguro, por lo que no podemos garantizar una seguridad absoluta. Aplicamos medidas técnicas y organizativas apropiadas para salvaguardar la seguridad de tus datos personales, incluidos los datos sensibles que decidas compartir en los Servicios. Estas medidas pueden incluir:",
          points: [
            "Cifrado: empleamos tecnologías de cifrado para proteger tus datos tanto en tránsito como en reposo.",
            "Controles de acceso: aplicamos controles de acceso estrictos para limitar quién puede acceder a tus datos.",
            "Minimización de datos: recogemos y conservamos únicamente los datos personales mínimos necesarios para prestar los Servicios.",
          ],
        },
        {
          title: "Cómo compartimos tu información",
          body: "No vendemos ni compartimos tus datos personales con terceros para sus fines de marketing. Podemos compartir tu información con terceros en las siguientes circunstancias:",
          points: [
            "Requerimientos legales: podemos divulgar tu información si así lo exige la ley o en respuesta a procesos legales, como una orden judicial o una citación.",
            "Transmisiones empresariales: en caso de fusión, adquisición o venta de activos, tu información podría transferirse al nuevo titular.",
          ],
        },
        {
          title: "Conservación de los datos",
          body: "Conservamos tus datos personales mientras mantengas una cuenta con nosotros. Puedes solicitar la eliminación de tus datos personales en cualquier momento escribiendo a support@pennysave.ai.",
          points: [],
        },
        {
          title: "Tus derechos (RGPD)",
          body: "En virtud del RGPD, tienes los siguientes derechos:",
          points: [
            "Acceso: tienes derecho a solicitar una copia de tus datos personales.",
            "Rectificación: tienes derecho a corregir datos personales inexactos o incompletos.",
            "Supresión: tienes derecho a solicitar la eliminación de tus datos personales.",
            "Limitación del tratamiento: tienes derecho a limitar el tratamiento de tus datos personales en determinadas circunstancias.",
            "Portabilidad de los datos: tienes derecho a recibir tus datos personales en un formato estructurado, de uso común y de lectura mecánica.",
            "Oposición: tienes derecho a oponerte al tratamiento de tus datos personales en determinadas circunstancias. Para ejercer cualquiera de estos derechos, contáctanos en support@pennysave.ai.",
          ],
        },
        {
          title: "Privacidad de los menores",
          body: "Los Servicios no están dirigidos a menores de 13 años. No recogemos conscientemente información personal de menores de 13 años.",
          points: [],
        },
        {
          title: "Cambios en esta Política",
          body: "Podemos actualizar esta Política de Privacidad de vez en cuando. Te notificaremos cualquier cambio publicando la nueva Política de Privacidad en los Servicios. Te recomendamos revisar esta Política de Privacidad periódicamente para estar al tanto de los cambios.",
          points: [],
        },
        {
          title: "Contacto",
          body: "Si tienes preguntas o dudas sobre esta Política de Privacidad o sobre nuestras prácticas de datos, contáctanos en support@pennysave.ai.",
          points: [],
        },
      ],
    },
  },
};

export default es;
