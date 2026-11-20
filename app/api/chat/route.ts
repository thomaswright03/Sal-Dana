import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { assistantModel, runTool, supportsFallbacks, systemPrompt, tools } from "@/lib/assistant";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";

export const maxDuration = 120;

const bodySchema = z.object({
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

type Block = Anthropic.Beta.BetaContentBlock;

const OFFLINE = `The assistant is offline right now. Please call or text ${site.phoneDisplay}, or use the booking form on this page.`;

/**
 * After a mid-response fallback, model-internal blocks from before the switch
 * must not be echoed back, while the fallback marker itself stays in place.
 */
function echoable(content: Block[]): Block[] {
  let boundary = -1;
  content.forEach((b, i) => {
    if ((b.type as string) === "fallback") boundary = i;
  });
  if (boundary === -1) return content;
  return content.filter(
    (b, i) => i >= boundary || !["thinking", "redacted_thinking", "tool_use"].includes(b.type as string),
  );
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`chat:${ip}`, 30, 10 * 60 * 1000)) {
    return Response.json(
      { error: `You're sending messages quickly. Give it a few minutes, or call ${site.phoneDisplay}.` },
      { status: 429 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: OFFLINE }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") {
    return Response.json({ error: "That message couldn't be read. Please try again." }, { status: 400 });
  }
  const history = parsed.data.messages;

  const client = new Anthropic();
  const model = assistantModel();
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const transcript = history
    .map((m) => `${m.role === "user" ? "Visitor" : "Assistant"}: ${m.content}`)
    .join("\n\n");
  const allowWrite = () => rateLimit(`chat-write:${ip}`, 3, 60 * 60 * 1000);

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      try {
        // Each pass is one model turn; tool calls loop back for another.
        for (let turn = 0; turn < 6; turn++) {
          const stream = client.beta.messages.stream(
            {
              model,
              max_tokens: 8000,
              system: systemPrompt(),
              tools,
              messages,
              output_config: { effort: "low" },
              // If the model declines a request for policy reasons, let the API
              // retry it on its default substitute model within the same call.
              ...(supportsFallbacks(model)
                ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
                : {}),
            },
            { signal: req.signal },
          );
          stream.on("text", (delta) => send({ type: "text", delta }));
          const message = await stream.finalMessage();

          if (message.stop_reason === "refusal") {
            send({
              type: "text",
              delta: `I'm not able to help with that here. For anything about your home project, I'm happy to help, or you can reach ${site.owner} at ${site.phoneDisplay}.`,
            });
            break;
          }
          if (message.stop_reason === "pause_turn") {
            messages.push({ role: "assistant", content: echoable(message.content) });
            continue;
          }
          if (message.stop_reason !== "tool_use") break;

          const calls = message.content.filter(
            (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use",
          );
          send({ type: "working" });
          const results = await Promise.all(
            calls.map(async (call) => {
              const outcome = await runTool(call.name, call.input, { transcript, allowWrite });
              if (outcome.event) send({ type: "event", event: outcome.event });
              return {
                type: "tool_result" as const,
                tool_use_id: call.id,
                content: outcome.content,
                is_error: outcome.isError ?? false,
              };
            }),
          );
          messages.push({ role: "assistant", content: echoable(message.content) });
          messages.push({ role: "user", content: results });
          // Separate any text written before the tool call from what follows it.
          send({ type: "text", delta: "\n\n" });
        }
        send({ type: "done" });
      } catch (err) {
        if (req.signal.aborted) return;
        if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
          console.error("assistant: API key rejected", err.status);
          send({ type: "error", message: OFFLINE });
        } else if (err instanceof Anthropic.RateLimitError) {
          send({
            type: "error",
            message: `The assistant is busy right now. Try again in a moment, or call ${site.phoneDisplay}.`,
          });
        } else if (err instanceof Anthropic.APIError) {
          console.error("assistant: API error", err.status, err.message);
          send({
            type: "error",
            message: `Something went wrong on our side. Please try again, or call ${site.phoneDisplay}.`,
          });
        } else {
          console.error("assistant: unexpected error", err);
          send({
            type: "error",
            message: `The connection dropped. Please try again, or call ${site.phoneDisplay}.`,
          });
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
