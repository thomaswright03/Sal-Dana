import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { analystPrompt, analystTools, runAnalystTool } from "@/lib/analyst";
import { streamAssistant } from "@/lib/assistant-stream";
import { requireOwner } from "@/lib/crm-guard";
import { aiAvailable } from "@/lib/settings";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const maxDuration = 120;

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
});

const NOT_CONNECTED =
  "The data assistant is off. Either no Anthropic API key is set (ANTHROPIC_API_KEY on Vercel) or it was switched off in Settings.";

/** The owner's data assistant. Read-only: it looks records up and never changes them. */
export async function POST(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;

  if (!rateLimit(`ask:${clientIp(req)}`, 60, 10 * 60 * 1000)) {
    return Response.json(
      { error: "That's a lot of questions at once. Give it a few minutes." },
      { status: 429 },
    );
  }
  if (!(await aiAvailable())) {
    return Response.json({ error: NOT_CONNECTED, code: "not_connected" }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") {
    return Response.json({ error: "That question couldn't be read. Please try again." }, { status: 400 });
  }
  const messages: Anthropic.Beta.BetaMessageParam[] = parsed.data.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return streamAssistant({
    signal: req.signal,
    label: "data assistant",
    system: analystPrompt(),
    tools: analystTools,
    messages,
    runTool: runAnalystTool,
    effort: "medium",
    maxTurns: 8,
    maxTokens: 4000,
    text: {
      refusal:
        "I can't help with that one. Ask me about your leads, visits, revenue, website traffic or reviews.",
      offline: NOT_CONNECTED,
      busy: "The assistant is busy right now. Try again in a moment.",
      failed: "Something went wrong on our side. Please try again.",
      dropped: "The connection dropped. Please try again.",
    },
  });
}
