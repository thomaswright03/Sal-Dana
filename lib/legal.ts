import type { Locale } from "./i18n";
import { site } from "./site";

/** Privacy policy and terms, in each language. Keep in step with DATA.md and LEGAL.md. */

export const LEGAL_UPDATED = "2026-11-21";
export const RETENTION = { leadMonths: 24, transcriptMonths: 12 } as const;

export interface Section {
  h: string;
  p: string[];
}
export interface LegalDoc {
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
}

const { legalName, email } = site;

const privacyEn: LegalDoc = {
  title: "Privacy policy",
  updated: `Effective ${LEGAL_UPDATED}`,
  intro: `This explains what ${legalName} (“we”, “us”) does with the information you give this website. We are a small handyman and renovation business in Arizona. We do not sell your information.`,
  sections: [
    { h: "Who we are and how to reach us", p: [`${legalName}, Arizona, USA. Email ${email} or call or text ${site.phoneDisplay}.`] },
    {
      h: "What we collect",
      p: [
        "Booking requests: your name, phone number, email (optional), address or city (optional), the job, a preferred day and time, and your language. This comes from the booking form or from the chat assistant.",
        "Chat messages: what you type to the assistant. If you book a visit or ask for a call back through the chat, the conversation is saved with your request.",
        "Customer reviews: added by the owner, with the customer’s permission. They show a name, city, rating and text.",
        "Visit counts: a daily total of visitors, with your language, the site you came from, and actions such as opening the chat. No cookies, no IP address and no ID is stored for this.",
        "Technical logs: our host (Vercel) keeps standard server logs that include IP addresses, and our abuse limiter briefly holds IP addresses in memory to stop spam.",
      ],
    },
    {
      h: "Why we use it",
      p: [
        "To answer you, schedule and carry out visits, and keep records of our jobs. The owner may also use an AI tool inside his private dashboard to ask questions about these records, such as “how many leads came in this month?”.",
        "To keep the site secure and working, and to count how many people visit.",
      ],
    },
    {
      h: "Who receives it",
      p: [
        "Vercel Inc. hosts the website and stores our records in a private store (United States).",
        "Anthropic, PBC provides the AI model. When you use the chat assistant, your messages are sent to Anthropic to produce replies. When the owner uses the dashboard’s Ask AI, details of leads (such as name, city, service, visit time, and the notes and conversation for a lead he asks about) are sent to Anthropic. Anthropic processes this in the United States or other places it operates. Under Anthropic’s commercial terms, data sent through its API is not used to train its models.",
        "We do not sell or share your information for advertising, and we use no third-party trackers or ad pixels. We may disclose information if the law requires it.",
      ],
    },
    {
      h: "Cookies and similar storage",
      p: [
        "Visitors get no cookies. Your browser’s session storage keeps a flag (so we count your visit once) and your current chat, and it clears when you close the tab. The owner’s sign-in uses one cookie, only for the owner dashboard.",
      ],
    },
    {
      h: "How long we keep it",
      p: [
        `Booking requests that did not become a job are deleted after ${RETENTION.leadMonths} months. Saved chat transcripts are deleted after ${RETENTION.transcriptMonths} months. Records of completed jobs are kept while they are useful for the business, and deleted when you ask. Reviews stay until you or the owner ask to remove them. Hosting logs follow Vercel’s own schedule.`,
      ],
    },
    {
      h: "Your choices",
      p: [
        `You can ask us to see, correct or delete what we hold about you. Email ${email} and we will reply, usually within 30 days. We will verify it is you before sharing anything.`,
      ],
    },
    {
      h: "Where your information goes",
      p: ["Our records are stored in the United States. The service is for people in Phoenix and the East Valley, Arizona. We do not offer it outside the United States."],
    },
    { h: "Children", p: ["This site is for homeowners and adults aged 18 and over. We do not knowingly collect information from children."] },
    {
      h: "Security",
      p: ["Records sit in a private store behind a password-protected dashboard. No system is perfectly secure, so we cannot promise absolute security. If a breach affects you, we will tell you as the law requires."],
    },
    { h: "Changes", p: ["We will change the date at the top when this policy changes. Earlier versions are kept in our code history. Material changes will be flagged on this page."] },
  ],
};

const privacyEs: LegalDoc = {
  title: "Política de privacidad",
  updated: `En vigor desde ${LEGAL_UPDATED}`,
  intro: `Aquí explicamos qué hace ${legalName} («nosotros») con la información que das en este sitio. Somos un pequeño negocio de reparaciones y remodelaciones en Arizona. No vendemos tu información.`,
  sections: [
    { h: "Quiénes somos y cómo contactarnos", p: [`${legalName}, Arizona, EE. UU. Correo: ${email}. Llama o envía un mensaje al ${site.phoneDisplay}.`] },
    {
      h: "Qué recopilamos",
      p: [
        "Solicitudes de visita: tu nombre, teléfono, correo (opcional), dirección o ciudad (opcional), el trabajo, día y hora preferidos y tu idioma. Vienen del formulario o del asistente de chat.",
        "Mensajes del chat: lo que escribes al asistente. Si reservas una visita o pides que te llamen desde el chat, la conversación se guarda con tu solicitud.",
        "Reseñas de clientes: las agrega el dueño con permiso del cliente. Muestran nombre, ciudad, calificación y texto.",
        "Conteo de visitas: un total diario de visitantes, con idioma, el sitio de origen y acciones como abrir el chat. No se guardan cookies, direcciones IP ni identificadores para esto.",
        "Registros técnicos: nuestro proveedor (Vercel) guarda registros del servidor que incluyen direcciones IP, y nuestro limitador contra abuso guarda IP brevemente en memoria para frenar el spam.",
      ],
    },
    {
      h: "Para qué la usamos",
      p: [
        "Para responderte, programar y realizar visitas y llevar registro de nuestros trabajos. El dueño también puede usar una herramienta de IA en su panel privado para hacer preguntas sobre estos registros, como «¿cuántos contactos llegaron este mes?».",
        "Para mantener el sitio seguro y funcionando, y contar cuánta gente lo visita.",
      ],
    },
    {
      h: "Quién la recibe",
      p: [
        "Vercel Inc. aloja el sitio y guarda nuestros registros en un almacén privado (Estados Unidos).",
        "Anthropic, PBC ofrece el modelo de IA. Cuando usas el asistente, tus mensajes se envían a Anthropic para generar las respuestas. Cuando el dueño usa «Ask AI» en el panel, se envían a Anthropic datos de contactos (como nombre, ciudad, servicio, fecha de visita, y las notas y la conversación del contacto sobre el que pregunta). Anthropic los procesa en Estados Unidos u otros lugares donde opera. Según los términos comerciales de Anthropic, los datos enviados por su API no se usan para entrenar sus modelos.",
        "No vendemos ni compartimos tu información para publicidad, y no usamos rastreadores ni píxeles de terceros. Podemos revelar información si la ley lo exige.",
      ],
    },
    {
      h: "Cookies y almacenamiento similar",
      p: [
        "Los visitantes no reciben cookies. El almacenamiento de sesión de tu navegador guarda una marca (para contar tu visita una sola vez) y tu chat actual, y se borra al cerrar la pestaña. El acceso del dueño usa una cookie, solo para el panel del dueño.",
      ],
    },
    {
      h: "Cuánto tiempo la conservamos",
      p: [
        `Las solicitudes que no se convirtieron en trabajo se borran a los ${RETENTION.leadMonths} meses. Las conversaciones guardadas del chat se borran a los ${RETENTION.transcriptMonths} meses. Los registros de trabajos terminados se conservan mientras sean útiles para el negocio y se borran si lo pides. Las reseñas permanecen hasta que tú o el dueño pidan quitarlas. Los registros del proveedor siguen el calendario de Vercel.`,
      ],
    },
    {
      h: "Tus opciones",
      p: [`Puedes pedir ver, corregir o borrar lo que tenemos sobre ti. Escribe a ${email} y responderemos, normalmente en 30 días. Verificaremos que eres tú antes de compartir algo.`],
    },
    {
      h: "A dónde va tu información",
      p: ["Guardamos los registros en Estados Unidos. El servicio es para Phoenix y el East Valley, Arizona. No lo ofrecemos fuera de Estados Unidos."],
    },
    { h: "Menores", p: ["Este sitio es para propietarios y adultos de 18 años o más. No recopilamos a sabiendas información de menores."] },
    {
      h: "Seguridad",
      p: ["Los registros están en un almacén privado detrás de un panel con contraseña. Ningún sistema es perfectamente seguro, así que no podemos prometer seguridad absoluta. Si una filtración te afecta, te avisaremos como exige la ley."],
    },
    { h: "Cambios", p: ["Cambiaremos la fecha al inicio cuando cambie esta política. Las versiones anteriores se conservan en nuestro historial de código. Los cambios importantes se indicarán en esta página."] },
  ],
};

const termsEn: LegalDoc = {
  title: "Terms of use",
  updated: `Effective ${LEGAL_UPDATED}`,
  intro: `These terms apply when you use this website, operated by ${legalName}, Arizona. By using it you agree to them. If you don’t agree, please don’t use the site; you can always call or text us instead.`,
  sections: [
    { h: "What this site is", p: ["It describes our handyman and renovation work and lets you ask for a visit. It has no accounts and takes no payments. A booking is a request only. A visit is not confirmed until the owner confirms it by call or text. Estimates are given after seeing the job, and nothing here is a quote or a contract for work."] },
    { h: "Acceptable use", p: ["Please don’t misuse the site: no spam or false requests, no attempts to break into the dashboard, no automated scraping, and no using the chat to generate content unrelated to our services."] },
    { h: "The AI assistant", p: ["The chat assistant is an AI. It can be wrong. It cannot give prices, confirm licences, insurance or warranties, or promise dates. Please confirm anything important with the owner directly. It is not professional, safety, legal or financial advice. For emergencies, call 911 or your utility."] },
    { h: "Ownership", p: [`The site’s design, text, images and the “Sal Dana” name belong to ${legalName} or its licensors. You may view the site for your own use, but not copy it for commercial purposes without permission.`] },
    { h: "No warranty", p: ["The site is provided “as is” and “as available”, without warranties of any kind, to the extent the law allows. Any work we do is covered by what we agree with you for that job, not by this website."] },
    { h: "Limit of liability", p: [`To the extent the law allows, ${legalName} is not liable for indirect or consequential losses arising from your use of the website. Nothing here limits liability that cannot be limited by law.`] },
    { h: "Third-party services", p: ["The site uses Vercel for hosting and Anthropic for the AI assistant. Their own terms and policies apply to their services. See our privacy policy for what they receive."] },
    { h: "Governing law and disputes", p: ["Arizona law governs these terms. Disputes are heard in the state or federal courts located in Maricopa County, Arizona, unless the law gives you another right."] },
    { h: "Changes", p: ["We may update these terms. The date above shows the current version, and earlier versions are kept in our code history."] },
    { h: "Contact", p: [`${legalName}. Email ${email}. Phone or text ${site.phoneDisplay}.`] },
  ],
};

const termsEs: LegalDoc = {
  title: "Términos de uso",
  updated: `En vigor desde ${LEGAL_UPDATED}`,
  intro: `Estos términos se aplican cuando usas este sitio, operado por ${legalName}, Arizona. Al usarlo, los aceptas. Si no estás de acuerdo, no uses el sitio; siempre puedes llamarnos o escribirnos.`,
  sections: [
    { h: "Qué es este sitio", p: ["Describe nuestros trabajos de reparación y remodelación y te permite pedir una visita. No tiene cuentas ni cobra pagos. Una reserva es solo una solicitud. La visita no queda confirmada hasta que el dueño la confirme por llamada o mensaje. Los presupuestos se dan después de ver el trabajo, y nada aquí es una cotización ni un contrato."] },
    { h: "Uso aceptable", p: ["No uses mal el sitio: nada de spam ni solicitudes falsas, ni intentos de entrar al panel, ni extracción automatizada de datos, ni usar el chat para generar contenido ajeno a nuestros servicios."] },
    { h: "El asistente de IA", p: ["El asistente del chat es una IA. Puede equivocarse. No puede dar precios, confirmar licencias, seguros ni garantías, ni prometer fechas. Confirma cualquier cosa importante directamente con el dueño. No es asesoría profesional, de seguridad, legal ni financiera. En emergencias, llama al 911 o a tu compañía de servicios."] },
    { h: "Propiedad", p: [`El diseño, los textos, las imágenes del sitio y el nombre «Sal Dana» pertenecen a ${legalName} o a sus licenciantes. Puedes ver el sitio para uso personal, pero no copiarlo con fines comerciales sin permiso.`] },
    { h: "Sin garantía", p: ["El sitio se ofrece «tal cual» y «según disponibilidad», sin garantías de ningún tipo, en la medida que la ley lo permita. Cualquier trabajo que hagamos se rige por lo que acordemos contigo para ese trabajo, no por este sitio."] },
    { h: "Límite de responsabilidad", p: [`En la medida que la ley lo permita, ${legalName} no responde por pérdidas indirectas o consecuentes derivadas del uso del sitio. Nada aquí limita responsabilidades que la ley no permite limitar.`] },
    { h: "Servicios de terceros", p: ["El sitio usa Vercel para alojamiento y Anthropic para el asistente de IA. Se aplican sus propios términos y políticas. Consulta nuestra política de privacidad para saber qué reciben."] },
    { h: "Ley aplicable y disputas", p: ["Estos términos se rigen por las leyes de Arizona. Las disputas se resolverán en los tribunales estatales o federales del condado de Maricopa, Arizona, salvo que la ley te dé otro derecho."] },
    { h: "Cambios", p: ["Podemos actualizar estos términos. La fecha de arriba indica la versión vigente, y las anteriores se conservan en nuestro historial de código."] },
    { h: "Contacto", p: [`${legalName}. Correo: ${email}. Teléfono o mensaje: ${site.phoneDisplay}.`] },
  ],
};

export const legalDocs: Record<Locale, { privacy: LegalDoc; terms: LegalDoc }> = {
  en: { privacy: privacyEn, terms: termsEn },
  es: { privacy: privacyEs, terms: termsEs },
};

export const LEGAL_PATHS: Record<Locale, { privacy: string; terms: string }> = {
  en: { privacy: "/privacy", terms: "/terms" },
  es: { privacy: "/es/privacy", terms: "/es/terms" },
};

export const LEGAL_LABELS: Record<Locale, { privacy: string; terms: string; back: string; chatNotice: string }> = {
  en: {
    privacy: "Privacy policy",
    terms: "Terms",
    back: "Back to the site",
    chatNotice: "Chats are saved with your request and processed by our AI provider, Anthropic.",
  },
  es: {
    privacy: "Privacidad",
    terms: "Términos",
    back: "Volver al sitio",
    chatNotice: "Los chats se guardan con tu solicitud y los procesa nuestro proveedor de IA, Anthropic.",
  },
};
