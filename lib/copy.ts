import type { Locale } from "./i18n";
import { faqs, principles, processSteps, services, site } from "./site";

/**
 * Every word a visitor reads on the public site, in each language.
 * English content that also feeds the assistant and structured data lives in
 * `site.ts`; this file adds the interface text and the Spanish version.
 */

/** A two-line display heading: a plain first line, then an optional lead-in and an accented phrase. */
export interface Heading {
  first: string;
  lead?: string;
  accent: string;
}

export interface Copy {
  meta: { title: string; description: string; tagline: string };
  region: string;
  hours: string;
  registered: string;
  bookCta: string;
  scroll: string;
  nav: {
    services: string;
    process: string;
    standard: string;
    reviews: string;
    questions: string;
    home: string;
    openMenu: string;
    closeMenu: string;
    language: string;
  };
  preloader: string;
  hero: { eyebrow: string; heading: Heading; body: string };
  manifesto: { eyebrow: string; text: string };
  services: {
    eyebrow: string;
    heading: Heading;
    count: string;
    list: { id: string; title: string; blurb: string; items: readonly string[] }[];
    other: { eyebrow: string; title: string; body: string; cursor: string };
  };
  process: {
    eyebrow: string;
    heading: Heading;
    body: string;
    step: string;
    steps: { title: string; body: string }[];
  };
  standard: {
    eyebrow: string;
    heading: Heading;
    body: string;
    principles: { title: string; body: string }[];
  };
  reviews: {
    eyebrow: string;
    heading: Heading;
    sample: string;
    onGoogle: string;
    fromCount: (n: number) => string;
    stars: (n: number) => string;
  };
  area: { eyebrow: string; body: string };
  booking: {
    eyebrow: string;
    heading: Heading;
    body: string;
    callOrText: string;
    email: string;
    hours: string;
    name: string;
    namePlaceholder: string;
    phone: string;
    emailField: string;
    emailPlaceholder: string;
    address: string;
    need: string;
    somethingElse: string;
    day: string;
    time: string;
    details: string;
    detailsPlaceholder: string;
    submit: string;
    sending: string;
    privacy: string;
    doneBooked: string;
    doneReceived: string;
    doneBody: string;
    again: string;
    errorInvalid: string;
    errorBusy: string;
    errorFailed: string;
  };
  faq: { eyebrow: string; heading: Heading; items: { q: string; a: string }[] };
  footer: {
    lead: string;
    accent: string;
    text: string;
    contact: string;
    hours: string;
    area: string;
    explore: string;
    legal: string;
    owner: string;
  };
  chat: {
    open: string;
    openLabel: string;
    close: string;
    dialog: string;
    title: string;
    subtitle: string;
    greeting: string;
    suggestions: string[];
    booked: string;
    callback: string;
    callbackBody: string;
    checking: string;
    thinking: string;
    placeholder: string;
    messageLabel: string;
    send: string;
    footnote: string;
    errorGeneric: string;
    errorDropped: string;
  };
}

const en: Copy = {
  meta: {
    title: `${site.name} | Handyman & Renovations in ${site.region}`,
    description: site.description,
    tagline: site.tagline,
  },
  region: site.region,
  hours: site.hoursDisplay,
  registered: "Registered Arizona LLC",
  bookCta: "Book a visit",
  scroll: "Scroll",
  nav: {
    services: "Services",
    process: "Process",
    standard: "Standard",
    reviews: "Reviews",
    questions: "Questions",
    home: `${site.name} home`,
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
  },
  preloader: "Preparing the site",
  hero: {
    eyebrow: `Handyman & renovations · ${site.region}`,
    heading: { first: "Your home,", lead: "finished", accent: "properly." },
    body: `Repairs, installs, and renovations by one craftsman who treats every detail as the one that matters. Meet ${site.owner}.`,
  },
  manifesto: {
    eyebrow: "The approach",
    text: `${site.name} is the work of one craftsman. ${site.owner} measures twice, protects your floors, and finishes by hand. Whether it’s a single stubborn door or a whole room made new, it gets the same patience, the same care, and the same eye for the details nobody else will notice.`,
  },
  services: {
    eyebrow: "What we do",
    heading: { first: "One call for", accent: "the whole list." },
    count: "services",
    list: services.map((s) => ({ ...s })),
    other: {
      eyebrow: "Not on the list?",
      title: "Ask anyway.",
      body: "If it’s in or around your home and it needs doing well, tell us about it.",
      cursor: "Book",
    },
  },
  process: {
    eyebrow: "How it works",
    heading: { first: "Simple,", lead: "start to", accent: "finish." },
    body: "No call centers and no crews you’ve never met. You deal with one person from the first message to the final walkthrough.",
    step: "Step",
    steps: processSteps.map((s) => ({ ...s })),
  },
  standard: {
    eyebrow: "The standard",
    heading: { first: "The small things", lead: "are", accent: "the whole point." },
    body: `Anyone can make a repair. ${site.owner} makes it look like nothing was ever wrong.`,
    principles: principles.map((p) => ({ ...p })),
  },
  reviews: {
    eyebrow: "Reviews",
    heading: { first: "Word of mouth,", accent: "written down." },
    sample: "Sample reviews for preview",
    onGoogle: "Reviews on Google",
    fromCount: (n) => `From ${n} customer reviews`,
    stars: (n) => `${n} out of 5 stars`,
  },
  area: {
    eyebrow: `Where we work · ${site.state}`,
    body: `Serving ${site.region}. Somewhere nearby that isn’t listed? Ask. The answer is usually yes.`,
  },
  booking: {
    eyebrow: "Book a visit",
    heading: { first: "Let’s get", lead: "it", accent: "done." },
    body: `Tell us what you need and when suits you. ${site.owner} will confirm your visit personally by call or text.`,
    callOrText: "Call or text",
    email: "Email",
    hours: "Hours",
    name: "Your name",
    namePlaceholder: "Jane Doe",
    phone: "Phone",
    emailField: "Email (optional)",
    emailPlaceholder: "you@email.com",
    address: "City or address (optional)",
    need: "What do you need?",
    somethingElse: "Something else",
    day: "Preferred day (optional)",
    time: "Time of day",
    details: "Tell us about the job",
    detailsPlaceholder: "A few words about what needs doing",
    submit: "Request a visit",
    sending: "Sending",
    privacy: "We only use your details to get back to you about your project.",
    doneBooked: "Visit requested.",
    doneReceived: "Request received.",
    doneBody: `Thank you. ${site.owner} will be in touch shortly by call or text to confirm the details.`,
    again: "Send another request",
    errorInvalid: "Please check the form and try again.",
    errorBusy: "Too many requests. Please call or text us instead.",
    errorFailed: "Something went wrong. Please call or text us instead.",
  },
  faq: {
    eyebrow: "Questions",
    heading: { first: "Good to", accent: "know." },
    items: faqs.map((f) => ({ ...f })),
  },
  footer: {
    lead: "Something at home needs doing",
    accent: "well?",
    text: "Send a text",
    contact: "Contact",
    hours: "Hours",
    area: "Area",
    explore: "Explore",
    legal: "A registered Arizona limited liability company.",
    owner: "Owner sign-in",
  },
  chat: {
    open: "Ask & book",
    openLabel: "Open the booking assistant",
    close: "Close the assistant",
    dialog: "Booking assistant",
    title: "Sal Dana concierge",
    subtitle: `AI assistant · books visits for ${site.owner}`,
    greeting: `Hello, and welcome. I can answer questions about ${site.owner}’s work or set up a visit for you. What’s going on at your place?`,
    suggestions: ["Book a visit", "What do you do?", "Do you come to my area?"],
    booked: "Visit requested",
    callback: "Message passed along",
    callbackBody: `${site.owner} will call or text you back.`,
    checking: "Checking the calendar",
    thinking: "Thinking",
    placeholder: "Type a message",
    messageLabel: "Message",
    send: "Send",
    footnote: `AI assistant. ${site.owner} confirms every visit personally.`,
    errorGeneric: `Something went wrong. Please call or text ${site.phoneDisplay}.`,
    errorDropped: `The connection dropped. Please try again, or call ${site.phoneDisplay}.`,
  },
};

const REGION_ES = "Phoenix y el East Valley";

const es: Copy = {
  meta: {
    title: `${site.name} | Reparaciones y renovaciones en ${REGION_ES}`,
    description: `${site.legalName} es el negocio de reparaciones y renovaciones de ${site.owner} en Arizona. Reparaciones, instalaciones y mejoras para el hogar hechas con cuidado, por un solo artesano, de principio a fin.`,
    tagline: "Reparaciones y renovaciones, terminadas con un estándar más alto.",
  },
  region: REGION_ES,
  hours: "Lunes a sábado, de 8 a. m. a 5 p. m.",
  registered: "LLC registrada en Arizona",
  bookCta: "Agenda una visita",
  scroll: "Desliza",
  nav: {
    services: "Servicios",
    process: "Proceso",
    standard: "Estándar",
    reviews: "Reseñas",
    questions: "Preguntas",
    home: `Inicio de ${site.name}`,
    openMenu: "Abrir el menú",
    closeMenu: "Cerrar el menú",
    language: "Idioma",
  },
  preloader: "Preparando el sitio",
  hero: {
    eyebrow: `Reparaciones y renovaciones · ${REGION_ES}`,
    heading: { first: "Tu hogar,", lead: "bien", accent: "terminado." },
    body: `Reparaciones, instalaciones y renovaciones a cargo de un solo artesano que trata cada detalle como si fuera el más importante. Conoce a ${site.owner}.`,
  },
  manifesto: {
    eyebrow: "Nuestra forma de trabajar",
    text: `${site.name} es el trabajo de un solo artesano. ${site.owner} mide dos veces, protege tus pisos y da el acabado a mano. Ya sea una sola puerta rebelde o una habitación entera renovada, todo recibe la misma paciencia, el mismo cuidado y el mismo ojo para los detalles que nadie más notaría.`,
  },
  services: {
    eyebrow: "Lo que hacemos",
    heading: { first: "Una llamada para", accent: "toda la lista." },
    count: "servicios",
    list: [
      {
        id: "kitchens-baths",
        title: "Renovación de cocina y baño",
        blurb:
          "Herrajes de gabinetes, llaves y accesorios, tocadores, salpicaderos, sellador y boquilla. Los detalles que hacen que un espacio se sienta nuevo.",
        items: ["Accesorios y herrajes", "Tocadores y espejos", "Salpicadero", "Sellador y boquilla nuevos"],
      },
      {
        id: "carpentry",
        title: "Carpintería y molduras",
        blurb:
          "Zoclos, cornisas, marcos, repisas y detalles empotrados, ajustados al milímetro y con acabado limpio.",
        items: [
          "Zoclos y cornisas",
          "Repisas a la medida",
          "Marcos de puertas",
          "Reparaciones y madera dañada",
        ],
      },
      {
        id: "drywall-paint",
        title: "Tablaroca y pintura",
        blurb:
          "Parches que después no vas a encontrar. Textura igualada, líneas nítidas y cuartos repintados sin desorden.",
        items: ["Parches y reparación", "Igualado de textura", "Pintura interior", "Retoques"],
      },
      {
        id: "doors-windows",
        title: "Puertas y herrajes",
        blurb:
          "Puertas que cierran con un clic suave. Instalación, ajuste, cerraduras, burletes y cerraduras inteligentes.",
        items: ["Instalación de puertas", "Cerraduras inteligentes", "Ajuste y alineación", "Burletes"],
      },
      {
        id: "tile-flooring",
        title: "Azulejo y pisos",
        blurb:
          "Reparación de azulejo e instalaciones pequeñas, transiciones y arreglos de piso, trazados con cuidado para que cada línea quede en su lugar.",
        items: ["Reparación de azulejo", "Instalaciones pequeñas", "Transiciones", "Reparación de pisos"],
      },
      {
        id: "mounting-assembly",
        title: "Montaje e instalaciones",
        blurb:
          "Televisores, cuadros, espejos, repisas, persianas y cortinas, y armado de muebles. A nivel, bien anclado y sin cables a la vista.",
        items: ["Montaje de TV y cuadros", "Repisas", "Persianas y cortinas", "Armado de muebles"],
      },
      {
        id: "outdoor",
        title: "Exteriores y patio",
        blurb:
          "Portones, cercas, reparaciones de patio y retoques exteriores hechos para aguantar el sol de Arizona.",
        items: ["Portones y cercas", "Reparaciones de patio", "Pintura exterior", "Desgaste por sol y clima"],
      },
      {
        id: "punch-list",
        title: "La lista de pendientes",
        blurb:
          "Esa lista pegada en el refrigerador. Entrégala y cada pendiente queda resuelto en una sola visita, y bien hecho.",
        items: [
          "Antes o después de mudarte",
          "Preparación para vender",
          "Mantenimiento de temporada",
          "Trabajos varios",
        ],
      },
    ],
    other: {
      eyebrow: "¿No está en la lista?",
      title: "Pregunta igual.",
      body: "Si es en tu casa o alrededor de ella y hay que hacerlo bien, cuéntanos.",
      cursor: "Agenda",
    },
  },
  process: {
    eyebrow: "Cómo funciona",
    heading: { first: "Sencillo,", lead: "de principio a", accent: "fin." },
    body: "Sin centros de llamadas ni cuadrillas que nunca has visto. Tratas con una sola persona, desde el primer mensaje hasta la revisión final.",
    step: "Paso",
    steps: [
      {
        title: "Cuéntanos",
        body: `Envía algunos detalles por el formulario, el asistente o una llamada. Las fotos ayudan. ${site.owner} te responde directamente.`,
      },
      {
        title: "Visita y presupuesto",
        body: `${site.owner} revisa el trabajo, te explica las opciones y te da un presupuesto claro antes de empezar.`,
      },
      {
        title: "El trabajo",
        body: "Un solo artesano, en tu casa a la hora acordada. Pisos protegidos, el espacio ordenado y el trabajo bien hecho.",
      },
      {
        title: "Revisión final",
        body: "Revisan juntos cada detalle. El trabajo termina cuando tú quedas conforme.",
      },
    ],
  },
  standard: {
    eyebrow: "El estándar",
    heading: { first: "Los pequeños detalles", lead: "lo son", accent: "todo." },
    body: `Cualquiera puede hacer una reparación. ${site.owner} hace que parezca que nunca hubo un problema.`,
    principles: [
      {
        title: "Un solo artesano",
        body: "La persona con la que hablas es la que hace el trabajo. Sin relevos ni sorpresas de subcontratistas.",
      },
      {
        title: "Presupuestos claros",
        body: "Conoces el alcance y el precio antes de empezar. Si algo cambia, eres el primero en saberlo.",
      },
      {
        title: "Un espacio limpio",
        body: "Superficies cubiertas, polvo controlado, todo barrido. Tu casa queda mejor de como la encontramos.",
      },
      {
        title: "Bien terminado",
        body: "Uniones cerradas, líneas rectas, herrajes alineados. Los pequeños detalles lo son todo.",
      },
    ],
  },
  reviews: {
    eyebrow: "Reseñas",
    heading: { first: "De boca en boca,", accent: "por escrito." },
    sample: "Reseñas de muestra para la vista previa",
    onGoogle: "Reseñas en Google",
    fromCount: (n) => `De ${n} reseñas de clientes`,
    stars: (n) => `${n} de 5 estrellas`,
  },
  area: {
    eyebrow: "Dónde trabajamos · Arizona",
    body: `Atendemos ${REGION_ES}. ¿Vives cerca y tu ciudad no aparece? Pregunta. Casi siempre la respuesta es sí.`,
  },
  booking: {
    eyebrow: "Agenda una visita",
    heading: { first: "Manos a", lead: "la", accent: "obra." },
    body: `Cuéntanos qué necesitas y cuándo te conviene. ${site.owner} confirmará tu visita personalmente por llamada o mensaje.`,
    callOrText: "Llama o envía un mensaje",
    email: "Correo",
    hours: "Horario",
    name: "Tu nombre",
    namePlaceholder: "María Pérez",
    phone: "Teléfono",
    emailField: "Correo (opcional)",
    emailPlaceholder: "tu@correo.com",
    address: "Ciudad o dirección (opcional)",
    need: "¿Qué necesitas?",
    somethingElse: "Otra cosa",
    day: "Día preferido (opcional)",
    time: "Hora del día",
    details: "Cuéntanos sobre el trabajo",
    detailsPlaceholder: "Unas palabras sobre lo que hay que hacer",
    submit: "Solicitar una visita",
    sending: "Enviando",
    privacy: "Solo usamos tus datos para responderte sobre tu proyecto.",
    doneBooked: "Visita solicitada.",
    doneReceived: "Solicitud recibida.",
    doneBody: `Gracias. ${site.owner} se pondrá en contacto contigo pronto, por llamada o mensaje, para confirmar los detalles.`,
    again: "Enviar otra solicitud",
    errorInvalid: "Revisa el formulario e inténtalo de nuevo.",
    errorBusy: "Recibimos demasiadas solicitudes. Mejor llámanos o envíanos un mensaje.",
    errorFailed: "Algo salió mal. Mejor llámanos o envíanos un mensaje.",
  },
  faq: {
    eyebrow: "Preguntas",
    heading: { first: "Vale la pena", accent: "saberlo." },
    items: [
      {
        q: "¿Cómo agendo una visita?",
        a: `Usa el formulario, escribe al asistente en la esquina, o llama o envía un mensaje al ${site.phoneDisplay}. Elige el día y el horario que te convengan y ${site.owner} lo confirmará personalmente.`,
      },
      {
        q: "¿Qué tipo de trabajos hacen?",
        a: "De todo, desde una sola reparación hasta una lista completa de pendientes o la renovación de un cuarto: carpintería, tablaroca y pintura, puertas y herrajes, azulejo, montaje e instalaciones, y reparaciones exteriores. Si no sabes si tu trabajo entra, pregunta.",
      },
      {
        q: "¿Cómo funcionan los presupuestos?",
        a: `Cuéntanos qué necesitas y comparte fotos si puedes. Para la mayoría de los trabajos, ${site.owner} pasa a verlo en persona y luego te da un presupuesto claro antes de empezar.`,
      },
      {
        q: "¿Dónde trabajan?",
        a: "En Phoenix y el East Valley, incluyendo Scottsdale, Paradise Valley, Tempe, Mesa, Chandler y Gilbert. Si estás fuera de esa zona, escríbenos y vemos qué se puede hacer.",
      },
      {
        q: `¿${site.name} es un negocio registrado?`,
        a: `Sí. ${site.legalName} es una compañía de responsabilidad limitada registrada en Arizona.`,
      },
    ],
  },
  footer: {
    lead: "¿Algo en casa necesita hacerse",
    accent: "bien?",
    text: "Envía un mensaje",
    contact: "Contacto",
    hours: "Horario",
    area: "Zona",
    explore: "Explora",
    legal: "Una compañía de responsabilidad limitada registrada en Arizona.",
    owner: "Acceso del propietario",
  },
  chat: {
    open: "Pregunta y agenda",
    openLabel: "Abrir el asistente de reservas",
    close: "Cerrar el asistente",
    dialog: "Asistente de reservas",
    title: "Concierge Sal Dana",
    subtitle: `Asistente de IA · agenda visitas para ${site.owner}`,
    greeting: `Hola, te damos la bienvenida. Puedo responder preguntas sobre el trabajo de ${site.owner} o agendarte una visita. ¿Qué necesitas en tu casa?`,
    suggestions: ["Agendar una visita", "¿Qué trabajos hacen?", "¿Llegan a mi zona?"],
    booked: "Visita solicitada",
    callback: "Mensaje enviado",
    callbackBody: `${site.owner} te llamará o te enviará un mensaje.`,
    checking: "Revisando el calendario",
    thinking: "Pensando",
    placeholder: "Escribe un mensaje",
    messageLabel: "Mensaje",
    send: "Enviar",
    footnote: `Asistente de IA. ${site.owner} confirma cada visita personalmente.`,
    errorGeneric: `Algo salió mal. Llama o envía un mensaje al ${site.phoneDisplay}.`,
    errorDropped: `Se perdió la conexión. Inténtalo de nuevo o llama al ${site.phoneDisplay}.`,
  },
};

export const copy: Record<Locale, Copy> = { en, es };
