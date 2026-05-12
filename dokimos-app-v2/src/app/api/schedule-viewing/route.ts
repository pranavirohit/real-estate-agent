import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Returns the next weekday at least `minBusinessDays` out, set to 2:00 PM ET.
 * Correctly accounts for EDT (UTC-4) vs EST (UTC-5) so the ICS shows 2 PM ET.
 */
function pickViewingDate(minBusinessDays = 2): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  let added = 0;
  while (added < minBusinessDays) {
    d.setUTCDate(d.getUTCDate() + 1);
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) added++;
  }
  // Determine ET offset: EDT (UTC-4) Mar second Sun through Nov first Sun, EST (UTC-5) otherwise
  const month = d.getUTCMonth(); // 0-indexed
  const isEDT = month >= 2 && month <= 9; // rough but correct for scheduling 2-5 days out
  const etOffsetHours = isEDT ? 4 : 5;
  // 2:00 PM ET = 14:00 + offset in UTC
  d.setUTCHours(14 + etOffsetHours, 0, 0, 0);
  return d;
}

/** Format a Date as "Monday, May 13, 2026" in ET */
function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

/** Format a Date as "2:00 PM ET" */
function formatTime(d: Date): string {
  return (
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York",
    }) + " ET"
  );
}

/** ISO 8601 compact datetime for ICS: YYYYMMDDTHHMMSSZ */
function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Build a plain-text ICS calendar event string. */
function buildIcs(params: {
  uid: string;
  summary: string;
  description: string;
  location: string;
  start: Date;
  durationMinutes: number;
  organizerEmail: string;
  attendeeEmails: string[];
}): string {
  const { uid, summary, description, location, start, durationMinutes, organizerEmail, attendeeEmails } = params;
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const now = icsDate(new Date());
  const attendeeLines = attendeeEmails
    .map((e) => `ATTENDEE;CN=${e};RSVP=TRUE:mailto:${e}`)
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nostos//Apartment Viewing//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `LOCATION:${location}`,
    `ORGANIZER;CN=Nostos:mailto:${organizerEmail}`,
    attendeeLines,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

function buildTenantEmail(params: {
  tenantName: string;
  address: string;
  dateLabel: string;
  timeLabel: string;
  applicationId?: string;
  listingUrl?: string;
  landlordEmail?: string;
}): string {
  const { tenantName, address, dateLabel, timeLabel, applicationId, listingUrl, landlordEmail } = params;

  const viewListingBtn = listingUrl
    ? `<a href="${listingUrl}" style="display:inline-block;margin-top:20px;padding:11px 22px;background:#fff;color:#C2410C;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;border:1.5px solid rgba(194,65,12,0.35);">View listing &rarr;</a>`
    : "";

  const contactValue = landlordEmail
    ? `<a href="mailto:${landlordEmail}" style="color:#C2410C;text-decoration:none;font-weight:600;font-size:14px;">${landlordEmail}</a>`
    : `<span style="color:#44403c;font-size:14px;">Reply to this email to reschedule.</span>`;

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;max-width:580px;margin:0 auto;color:#1c1917;background:#f5f5f4;padding:28px 0">

  <!-- Header -->
  <div style="background:linear-gradient(140deg,#b83b0a 0%,#ea580c 60%,#f97316 100%);padding:36px 36px 32px;border-radius:16px 16px 0 0">
    <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.6)">Nostos</p>
    <table style="border-collapse:collapse;width:100%"><tr>
      <td style="vertical-align:middle;width:52px">
        <div style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.18);text-align:center;line-height:44px">
          <span style="color:#fff;font-size:22px;font-weight:700;">&#10003;</span>
        </div>
      </td>
      <td style="vertical-align:middle;padding-left:4px">
        <p style="margin:0;font-size:26px;font-weight:700;color:#fff;letter-spacing:-0.5px;line-height:1.15">Tour confirmed</p>
      </td>
    </tr></table>
  </div>

  <!-- Body -->
  <div style="background:#fff;border:1px solid #e7e5e4;border-top:none;border-radius:0 0 16px 16px;padding:36px">

    <p style="margin:0 0 28px;font-size:15px;color:#57534e;line-height:1.6">Hi <strong style="color:#1c1917">${tenantName}</strong>, your tour is locked in. See details below and check your calendar.</p>

    <!-- Step progress -->
    <table style="border-collapse:collapse;width:100%;margin:0 0 32px">
      <tr>
        <td style="text-align:center;width:33%;padding:0 4px">
          <div style="width:32px;height:32px;border-radius:50%;background:#dcfce7;margin:0 auto 7px;text-align:center;line-height:32px">
            <span style="color:#16a34a;font-size:15px;font-weight:700">&#10003;</span>
          </div>
          <p style="margin:0;font-size:11px;font-weight:600;color:#16a34a;letter-spacing:0.03em">Applied</p>
        </td>
        <td style="text-align:center;width:33%;padding:0 4px">
          <div style="width:32px;height:32px;border-radius:50%;background:#dcfce7;margin:0 auto 7px;text-align:center;line-height:32px">
            <span style="color:#16a34a;font-size:15px;font-weight:700">&#10003;</span>
          </div>
          <p style="margin:0;font-size:11px;font-weight:600;color:#16a34a;letter-spacing:0.03em">ID verified</p>
        </td>
        <td style="text-align:center;width:33%;padding:0 4px">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#C2410C,#ea580c);margin:0 auto 7px;text-align:center;line-height:32px">
            <span style="color:#fff;font-size:15px;font-weight:700">&#10003;</span>
          </div>
          <p style="margin:0;font-size:11px;font-weight:700;color:#C2410C;letter-spacing:0.03em">Tour booked</p>
        </td>
      </tr>
    </table>

    <!-- Tour card with left accent -->
    <div style="border-left:4px solid #ea580c;background:#fff7ed;border-radius:0 12px 12px 0;padding:22px 24px;margin:0 0 16px">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#92400e">Tour details</p>
      <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#1c1917;line-height:1.35">${address}</p>
      <table style="border-collapse:collapse">
        <tr>
          <td style="padding-right:28px;padding-bottom:14px;vertical-align:top">
            <p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a8a29e">Date</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#1c1917">${dateLabel}</p>
          </td>
          <td style="padding-right:28px;padding-bottom:14px;vertical-align:top">
            <p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a8a29e">Time</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#1c1917">${timeLabel}</p>
          </td>
          <td style="padding-bottom:14px;vertical-align:top">
            <p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a8a29e">Duration</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#1c1917">30 min</p>
          </td>
        </tr>
      </table>
      ${applicationId ? `<p style="margin:16px 0 0;font-size:11px;color:#a8a29e;font-family:monospace">Ref: ${applicationId}</p>` : ""}
      ${viewListingBtn}
    </div>

    <!-- Contact -->
    <div style="border:1px solid #e7e5e4;border-radius:12px;padding:18px 20px;margin:0 0 28px">
      <p style="margin:0 0 5px;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#a8a29e">Your point of contact</p>
      ${contactValue}
    </div>

    <p style="margin:0;font-size:13px;color:#a8a29e;line-height:1.7;border-top:1px solid #f5f5f4;padding-top:20px">
      A calendar invite is attached. The landlord has been notified and is expecting you.
    </p>
  </div>

  <!-- Footer -->
  <div style="padding:22px 36px;text-align:center">
    <p style="margin:0;font-size:12px;color:#a8a29e">Nostos &mdash; your identity, verified once, accepted everywhere.</p>
    <p style="margin:5px 0 0;font-size:11px;color:#d6d3d1;letter-spacing:0.05em">nostos.app</p>
  </div>

</div>`.trim();
}

function buildLandlordEmail(params: {
  tenantName: string;
  tenantEmail: string;
  address: string;
  dateLabel: string;
  timeLabel: string;
  listingUrl?: string;
  appBaseUrl: string;
}): string {
  const { tenantName, tenantEmail, address, dateLabel, timeLabel, listingUrl, appBaseUrl } = params;

  const viewListingBtn = listingUrl
    ? `<a href="${listingUrl}" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#fafaf9;color:#C2410C;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;border:1px solid rgba(194,65,12,0.3);">View Listing</a>`
    : "";

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#1c1917;background:#f5f5f4;padding:24px 0">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#C2410C,#ea580c);padding:28px 32px;border-radius:12px 12px 0 0">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.7)">Nostos</p>
    <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.3px">New verified applicant</p>
  </div>

  <!-- Body -->
  <div style="background:#fff;border:1px solid #e7e5e4;border-top:none;border-radius:0 0 12px 12px;padding:32px">

    <!-- Applicant card -->
    <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:10px;padding:20px 24px;margin:0 0 20px">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#78716c">Applicant</p>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 6px">
        <p style="margin:0;font-size:18px;font-weight:700;color:#1c1917">${tenantName}</p>
        <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;letter-spacing:0.02em">&#10003; Identity verified</span>
      </div>
      <a href="mailto:${tenantEmail}" style="font-size:13px;color:#C2410C;text-decoration:none;">${tenantEmail}</a>

      <!-- Verified attributes -->
      <div style="margin:16px 0 0;padding:14px 16px;background:#fff;border:1px solid #e7e5e4;border-radius:8px">
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#78716c">What was verified</p>
        <p style="margin:0 0 6px;font-size:13px;color:#1c1917"><span style="color:#16a34a;font-weight:700;margin-right:8px">&#10003;</span>Full name confirmed</p>
        <p style="margin:0 0 6px;font-size:13px;color:#1c1917"><span style="color:#16a34a;font-weight:700;margin-right:8px">&#10003;</span>Age 18+ confirmed</p>
        <p style="margin:0;font-size:13px;color:#1c1917"><span style="color:#16a34a;font-weight:700;margin-right:8px">&#10003;</span>Address confirmed</p>
      </div>
    </div>

    <!-- Viewing card -->
    <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:10px;padding:20px 24px;margin:0 0 20px">
      <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#78716c">Scheduled viewing</p>
      <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1c1917">${address}</p>
      <table style="border-collapse:collapse;width:100%">
        <tr>
          <td style="padding:4px 0;font-size:12px;font-weight:600;color:#78716c;width:52px">Date</td>
          <td style="padding:4px 0;font-size:14px;color:#1c1917">${dateLabel}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:12px;font-weight:600;color:#78716c">Time</td>
          <td style="padding:4px 0;font-size:14px;color:#1c1917">${timeLabel}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:12px;font-weight:600;color:#78716c">Duration</td>
          <td style="padding:4px 0;font-size:14px;color:#1c1917">30 minutes</td>
        </tr>
      </table>
      ${viewListingBtn}
    </div>

    <!-- CTA -->
    <a href="${appBaseUrl}/nostos/landlord" style="display:block;text-align:center;padding:14px 24px;background:linear-gradient(135deg,#C2410C,#ea580c);color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;margin:0 0 24px">View in Dashboard</a>

    <!-- Contact block -->
    <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:10px;padding:16px 20px">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#78716c">Contact</p>
      <p style="margin:0;font-size:13px;color:#44403c">To reach the applicant directly: <a href="mailto:${tenantEmail}" style="color:#C2410C;text-decoration:none;font-weight:600;">${tenantEmail}</a></p>
    </div>

  </div>

  <!-- Footer -->
  <div style="padding:20px 32px;text-align:center">
    <p style="margin:0;font-size:12px;color:#a8a29e">Nostos verifies applicants so you never have to ask for documents.</p>
    <p style="margin:6px 0 0;font-size:12px;color:#d6d3d1">nostos.app</p>
  </div>

</div>`.trim();
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() ?? "Nostos <onboarding@resend.dev>";
  const appBaseUrl = process.env.NEXTAUTH_URL?.trim() ?? "http://localhost:8081";

  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service is not configured (RESEND_API_KEY missing)." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    listingAddress,
    tenantEmail,
    tenantName,
    landlordEmail,
    applicationId,
    listingUrl,
  } = body as {
    listingAddress?: string;
    tenantEmail?: string;
    tenantName?: string;
    landlordEmail?: string;
    applicationId?: string;
    listingUrl?: string;
  };

  if (!listingAddress || !tenantEmail) {
    return NextResponse.json(
      { error: "listingAddress and tenantEmail are required." },
      { status: 400 }
    );
  }

  const viewingDate = pickViewingDate(2);
  const dateLabel = formatDate(viewingDate);
  const timeLabel = formatTime(viewingDate);
  const displayName = tenantName ?? tenantEmail.split("@")[0];

  const uid = `nostos-viewing-${Date.now()}@nostos-app`;
  const organizerEmail = fromEmail.includes("<")
    ? fromEmail.split("<")[1].replace(">", "")
    : fromEmail;

  const icsContent = buildIcs({
    uid,
    summary: `Apartment Tour: ${listingAddress}`,
    description: `Viewing scheduled for ${displayName} at ${listingAddress} via Nostos.`,
    location: listingAddress,
    start: viewingDate,
    durationMinutes: 30,
    organizerEmail,
    attendeeEmails: [tenantEmail, ...(landlordEmail ? [landlordEmail] : [])],
  });

  const resend = new Resend(apiKey);
  const errors: string[] = [];

  // In sandbox mode, Resend only delivers to the account's verified address.
  // RESEND_TO_OVERRIDE redirects all outgoing mail to that address for local dev.
  const toOverride = process.env.RESEND_TO_OVERRIDE?.trim();
  const resolveRecipient = (addr: string) => toOverride ?? addr;

  // Tenant email
  try {
    await resend.emails.send({
      from: fromEmail,
      to: resolveRecipient(tenantEmail),
      subject: `Tour confirmed: ${listingAddress}`,
      html: buildTenantEmail({
        tenantName: displayName,
        address: listingAddress,
        dateLabel,
        timeLabel,
        applicationId,
        listingUrl,
        landlordEmail,
      }),
      attachments: [
        {
          filename: "viewing.ics",
          content: Buffer.from(icsContent).toString("base64"),
        },
      ],
    });
  } catch (e) {
    console.error("[schedule-viewing] tenant email failed:", e);
    errors.push("tenant_email_failed");
  }

  // Landlord email (optional)
  if (landlordEmail) {
    try {
      await resend.emails.send({
        from: fromEmail,
        to: resolveRecipient(landlordEmail),
        subject: `New verified applicant: ${listingAddress}`,
        html: buildLandlordEmail({
          tenantName: displayName,
          tenantEmail,
          address: listingAddress,
          dateLabel,
          timeLabel,
          listingUrl,
          appBaseUrl,
        }),
        attachments: [
          {
            filename: "viewing.ics",
            content: Buffer.from(icsContent).toString("base64"),
          },
        ],
      });
    } catch (e) {
      console.error("[schedule-viewing] landlord email failed:", e);
      errors.push("landlord_email_failed");
    }
  }

  return NextResponse.json({
    viewingDate: viewingDate.toISOString(),
    dateLabel,
    timeLabel,
    ...(errors.length ? { warnings: errors } : {}),
  });
}
