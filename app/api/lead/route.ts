import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { checkDay } from "@/lib/schedule";
import { createPublicLead } from "@/lib/booking";
import { listLeads, StorageNotConfiguredError } from "@/lib/store";
import { publicLeadSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!rateLimit(`lead:${clientIp(req)}`, 6, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please call or text us instead." },
      { status: 429 },
    );
  }

  const parsed = publicLeadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Bots that fill the hidden field get a success response and nothing is saved.
  if (data.company) return NextResponse.json({ ok: true });

  try {
    let appointment = null;
    let note: string | undefined;
    if (data.date && data.window) {
      const day = checkDay(data.date, await listLeads());
      if (day.ok && day.open.includes(data.window)) {
        appointment = { date: data.date, window: data.window, status: "requested" as const };
      } else {
        note = `Asked for ${data.date} (${data.window}), which wasn't available. Offer another time.`;
      }
    } else if (data.date) {
      note = `Preferred date: ${data.date}`;
    }

    const result = await createPublicLead(
      {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        service: data.service,
        details: data.details,
        source: "website-form",
        language: data.language,
        note,
      },
      appointment,
      "save-without-visit",
      data.date && data.window
        ? `Asked for ${data.date} (${data.window}), which was just taken. Offer another time.`
        : undefined,
    );
    if (!result.ok) throw new Error("unreachable");
    return NextResponse.json({ ok: true, booked: result.booked });
  } catch (err) {
    if (!(err instanceof StorageNotConfiguredError)) console.error("lead form failed", err);
    return NextResponse.json(
      { error: "We couldn't save your request. Please call or text us instead." },
      { status: 503 },
    );
  }
}
