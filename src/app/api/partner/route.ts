import { Resend } from "resend";
import { NextResponse } from "next/server";
import { buildPartnerEmailHtml, buildPartnerEmailText } from "@/lib/partner-email";
import { getEmailRequestMeta, isValidEmail } from "@/lib/email-utils";
import { getContactEmailConfig } from "@/lib/market";

type PartnerBody = {
  org?: string;
  name?: string;
  email?: string;
  phone?: string;
  timeline?: string;
  capacities?: string[];
  message?: string;
};

export async function POST(request: Request) {
  let body: PartnerBody;

  try {
    body = (await request.json()) as PartnerBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const org = body.org?.trim() ?? "";
  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const timeline = body.timeline?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  const capacities = Array.isArray(body.capacities)
    ? body.capacities.map((item) => item.trim()).filter(Boolean)
    : [];

  if (!org || !name || !email || !phone) {
    return NextResponse.json({ error: "All required fields must be filled in." }, { status: 400 });
  }

  if (capacities.length === 0) {
    return NextResponse.json(
      { error: "Please select at least one way you'd like to partner." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  const { market, siteHost, submittedAt, ip, userAgent, visitorCountry } =
    getEmailRequestMeta(request);
  const { apiKey, from, to } = getContactEmailConfig(market);

  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service is not configured. Please try again later." },
      { status: 500 },
    );
  }

  if (!to) {
    return NextResponse.json(
      { error: "Email service is not configured. Please try again later." },
      { status: 500 },
    );
  }

  const emailPayload = {
    org,
    name,
    email,
    phone,
    timeline,
    capacities,
    message,
    market,
    siteHost,
    submittedAt,
    ip,
    userAgent,
    visitorCountry,
  };

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `StackForgeNext — Partner with us · ${org} · ${name}`,
      html: buildPartnerEmailHtml(emailPayload),
      text: buildPartnerEmailText(emailPayload),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Partner API error:", err);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 502 },
    );
  }
}
