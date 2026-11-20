import { clientIp, rateLimit } from "@/lib/rate-limit";
import { BOT_RE, classifyDevice, classifySource, recordHit } from "@/lib/traffic";
import { trackSchema } from "@/lib/validation";

/** Anonymous visit counter for the owner dashboard. Stores daily totals only. */
export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  // Always answer 204 so the page never waits on, or learns anything from, this call.
  const done = () => new Response(null, { status: 204 });
  if (!ua || BOT_RE.test(ua)) return done();
  if (!rateLimit(`track:${clientIp(req)}`, 40, 10 * 60 * 1000)) return done();

  const parsed = trackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return done();
  const data = parsed.data;
  try {
    if (data.kind === "view") {
      await recordHit({
        kind: "view",
        first: data.first,
        lang: data.lang,
        device: classifyDevice(ua),
        source: classifySource(data.ref, data.utm),
      });
    } else {
      await recordHit({ kind: "event", event: data.event });
    }
  } catch {
    /* counting visits must never break the site */
  }
  return done();
}
