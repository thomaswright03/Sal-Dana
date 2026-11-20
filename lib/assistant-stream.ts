import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const DEFAULT_MODEL = "claude-fable-5-2";

/** Models that accept the server-side refusal fallback parameter. */
const FALLBACK_MODELS = new Set([
  "claude-fable-5-2",
  "claude-fable-5-1",
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-sonnet-5-5",
]);

export function assistantModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
}

export interface ToolOutcome {
  content: string;
  isError?: boolean;
  /** Sent to the browser as a card or link alongside the reply. */
  event?: Record<string, unknown>;
}

/** What the person sees when something goes wrong, in their language. */
export interface StreamText {
  refusal: string;
  offline: string;
  busy: string;
  failed: string;
  dropped: string;
}

type Block = Anthropic.Beta.BetaContentBlock;

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

export interface StreamOptions {
  signal: AbortSignal;
  /** Used in server logs to tell the assistants apart. */
  label: string;
  system: string;
  tools: Anthropic.Beta.BetaTool[];
  messages: Anthropic.Beta.BetaMessageParam[];
  runTool: (name: string, input: unknown) => Promise<ToolOutcome>;
  text: StreamText;
  effort?: "low" | "medium";
  maxTurns?: number;
}

/**
 * Runs a conversation with tools and streams it to the browser as newline-delimited JSON:
 * {type:"text"|"working"|"event"|"error"|"done"}.
 */
export function streamAssistant(opts: StreamOptions): Response {
  const client = new Anthropic();
  const model = assistantModel();
  const messages = [...opts.messages];
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        // Each pass is one model turn; tool calls loop back for another.
        for (let turn = 0; turn < (opts.maxTurns ?? 6); turn++) {
          const stream = client.beta.messages.stream(
            {
              model,
              max_tokens: 8000,
              system: opts.system,
              tools: opts.tools,
              messages,
              output_config: { effort: opts.effort ?? "low" },
              // If the model declines a request for policy reasons, let the API
              // retry it on its default substitute model within the same call.
              ...(FALLBACK_MODELS.has(model)
                ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
                : {}),
            },
            { signal: opts.signal },
          );
          stream.on("text", (delta) => send({ type: "text", delta }));
          const message = await stream.finalMessage();

          if (message.stop_reason === "refusal") {
            send({ type: "text", delta: opts.text.refusal });
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
              const outcome = await opts.runTool(call.name, call.input);
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
        if (opts.signal.aborted) return;
        if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
          console.error(`${opts.label}: API key rejected`, err.status);
          send({ type: "error", message: opts.text.offline });
        } else if (err instanceof Anthropic.RateLimitError) {
          send({ type: "error", message: opts.text.busy });
        } else if (err instanceof Anthropic.APIError) {
          console.error(`${opts.label}: API error`, err.status, err.message);
          send({ type: "error", message: opts.text.failed });
        } else {
          console.error(`${opts.label}: unexpected error`, err);
          send({ type: "error", message: opts.text.dropped });
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
