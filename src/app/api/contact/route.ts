import { Resend } from "resend";
import { NextResponse } from "next/server";
import { buildContactEmailHtml, buildContactEmailText } from "@/lib/contact-email";
import { getContactEmailConfig, getMarketFromHost } from "@/lib/market";

type ContactBody = {
  name?: string;
  institution?: string;
  email?: string;
  phone?: string;
  message?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  let body: ContactBody;

  try {
    body = (await request.json()) as ContactBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const institution = body.institution?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (!name || !institution || !email || !phone || !message) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const market = getMarketFromHost(host);
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

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "Unknown";
  const userAgent = request.headers.get("user-agent") || "Unknown";
  const visitorCountry = request.headers.get("x-vercel-ip-country") || undefined;
  const siteHost = host.split(":")[0] || "stackedu.africa";
  const submittedAt = new Date().toUTCString();

  const emailPayload = {
    name,
    institution,
    email,
    phone,
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
      subject: `StackEDU demo request — ${name} · ${institution}`,
      html: buildContactEmailHtml(emailPayload),
      text: buildContactEmailText(emailPayload),
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
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 502 },
    );
  }
}
