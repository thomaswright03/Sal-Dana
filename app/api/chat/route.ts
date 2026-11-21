import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { runTool, systemPrompt, tools } from "@/lib/assistant";
import { streamAssistant, type StreamText } from "@/lib/assistant-stream";
import type { Locale } from "@/lib/i18n";
import { aiAvailable } from "@/lib/settings";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";

export const maxDuration = 120;

const bodySchema = z.object({
  locale: z.enum(["en", "es"]).default("en"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(40),
});

const phone = site.phoneDisplay;

const TEXT: Record<Locale, StreamText & { tooFast: string; unreadable: string }> = {
  en: {
    offline: `The assistant is offline right now. Please call or text ${phone}, or use the booking form on this page.`,
    tooFast: `You're sending messages quickly. Give it a few minutes, or call ${phone}.`,
    unreadable: "That message couldn't be read. Please try again.",
    refusal: `I'm not able to help with that here. For anything about your home project, I'm happy to help, or you can reach ${site.owner} at ${phone}.`,
    busy: `The assistant is busy right now. Try again in a moment, or call ${phone}.`,
    failed: `Something went wrong on our side. Please try again, or call ${phone}.`,
    dropped: `The connection dropped. Please try again, or call ${phone}.`,
  },
  es: {
    offline: `El asistente no está disponible en este momento. Llama o envía un mensaje al ${phone}, o usa el formulario de esta página.`,
    tooFast: `Estás enviando mensajes muy rápido. Espera unos minutos o llama al ${phone}.`,
    unreadable: "No pudimos leer ese mensaje. Inténtalo de nuevo.",
    refusal: `No puedo ayudarte con eso aquí. Con gusto te ayudo con lo que necesites para tu casa, o puedes comunicarte con ${site.owner} al ${phone}.`,
    busy: `El asistente está ocupado en este momento. Inténtalo de nuevo en un momento o llama al ${phone}.`,
    failed: `Algo salió mal de nuestro lado. Inténtalo de nuevo o llama al ${phone}.`,
    dropped: `Se perdió la conexión. Inténtalo de nuevo o llama al ${phone}.`,
  },
};

export async function POST(req: Request) {
  const raw = (await req.json().catch(() => null)) as { locale?: unknown } | null;
  const text = TEXT[raw?.locale === "es" ? "es" : "en"];

  const ip = clientIp(req);
  if (!rateLimit(`chat:${ip}`, 30, 10 * 60 * 1000)) {
    return Response.json({ error: text.tooFast }, { status: 429 });
  }
  if (!(await aiAvailable())) {
    return Response.json({ error: text.offline }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") {
    return Response.json({ error: text.unreadable }, { status: 400 });
  }
  const { locale, messages: history } = parsed.data;

  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const transcript = history
    .map((m) => `${m.role === "user" ? "Visitor" : "Assistant"}: ${m.content}`)
    .join("\n\n");
  const allowWrite = () => rateLimit(`chat-write:${ip}`, 3, 60 * 60 * 1000);

  return streamAssistant({
    signal: req.signal,
    label: "booking assistant",
    system: systemPrompt(locale),
    tools,
    messages,
    runTool: (name, input) => runTool(name, input, { locale, transcript, allowWrite }),
    text,
  });
}
