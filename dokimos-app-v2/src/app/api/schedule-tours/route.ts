import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export interface TourRequest {
  listingAddress: string;
  /** When present (demo/API listings), used to align TEE rows with landlord showcase addresses. */
  listingId?: string;
  landlordEmail?: string;
  listingUrl?: string;
}

export interface ScheduledTour {
  address: string;
  listingId?: string;
  dateLabel: string;
  timeLabel: string;
  viewingDate: string;
}

interface TimeSlot { hour: number; minute: number }

const MORNING_SLOTS: TimeSlot[] = [
  { hour: 9, minute: 0 },
  { hour: 10, minute: 0 },
  { hour: 10, minute: 30 },
  { hour: 11, minute: 0 },
];
const AFTERNOON_SLOTS: TimeSlot[] = [
  { hour: 13, minute: 0 },
  { hour: 14, minute: 0 },
  { hour: 15, minute: 0 },
  { hour: 15, minute: 30 },
];
const EVENING_SLOTS: TimeSlot[] = [
  { hour: 17, minute: 30 },
  { hour: 18, minute: 0 },
  { hour: 18, minute: 30 },
  { hour: 19, minute: 0 },
];
const DEFAULT_SLOTS: TimeSlot[] = [
  { hour: 10, minute: 0 },
  { hour: 11, minute: 30 },
  { hour: 13, minute: 0 },
  { hour: 14, minute: 30 },
  { hour: 16, minute: 0 },
];

function parseAvailability(note: string): {
  allowWeekdays: boolean;
  allowWeekends: boolean;
  timeSlots: TimeSlot[];
} {
  const lower = note.toLowerCase();
  const wantsWeekend = /weekend|saturday|sunday|sat\b|sun\b/.test(lower);
  const wantsWeekday = /weekday|monday|tuesday|wednesday|thursday|friday|mon\b|tue\b|wed\b|thu\b|fri\b/.test(lower);
  const allowWeekends = wantsWeekend || (!wantsWeekday && !wantsWeekend);
  const allowWeekdays = wantsWeekday || (!wantsWeekday && !wantsWeekend);

  let timeSlots: TimeSlot[];
  if (/evening|after.?5|after.?6|after.?7|after.?4pm|after.?5pm|after.?6pm|night/.test(lower)) {
    timeSlots = EVENING_SLOTS;
  } else if (/morning|before.?noon|am\b|before.?12/.test(lower)) {
    timeSlots = MORNING_SLOTS;
  } else if (/afternoon|after.?noon|after.?1|after.?2|after.?12/.test(lower)) {
    timeSlots = AFTERNOON_SLOTS;
  } else {
    const afterMatch = lower.match(/after\s+(\d+)\s*(pm)?/);
    if (afterMatch) {
      const h = parseInt(afterMatch[1], 10) + (afterMatch[2] ? 0 : parseInt(afterMatch[1], 10) < 12 ? 12 : 0);
      if (h >= 17) timeSlots = EVENING_SLOTS;
      else if (h >= 12) timeSlots = AFTERNOON_SLOTS;
      else timeSlots = MORNING_SLOTS;
    } else {
      timeSlots = DEFAULT_SLOTS;
    }
  }
  return { allowWeekdays, allowWeekends, timeSlots };
}

/** Returns whether a given UTC date is during EDT (UTC-4) vs EST (UTC-5). */
function isEDT(d: Date): boolean {
  const month = d.getUTCMonth(); // 0-indexed
  return month >= 2 && month <= 9; // Mar (2) through Oct (9) — good approximation
}

/**
 * Returns an array of N distinct slots honouring user availability.
 * All times are set correctly in ET (accounting for EDT/EST).
 */
function pickTourSlots(count: number, availabilityNote?: string, minDaysOut = 1): Date[] {
  const { allowWeekdays, allowWeekends, timeSlots } = availabilityNote
    ? parseAvailability(availabilityNote)
    : { allowWeekdays: true, allowWeekends: false, timeSlots: DEFAULT_SLOTS };

  const slots: Date[] = [];
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  cursor.setUTCDate(cursor.getUTCDate() + minDaysOut);

  let safetyLimit = 60;
  while (slots.length < count && safetyLimit-- > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const day = cursor.getUTCDay();
    const isWeekend = day === 0 || day === 6;
    if (isWeekend && !allowWeekends) continue;
    if (!isWeekend && !allowWeekdays) continue;

    const timeSlot = timeSlots[slots.length % timeSlots.length];
    const slot = new Date(cursor);
    // Convert ET local time to UTC: EDT = UTC-4, EST = UTC-5
    const offsetHours = isEDT(slot) ? 4 : 5;
    slot.setUTCHours(timeSlot.hour + offsetHours, timeSlot.minute, 0, 0);
    slots.push(slot);
  }

  return slots;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

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

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

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
    "PRODID:-//Nostos//Apartment Tour//EN",
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

function buildTourEmail(params: {
  tenantName: string;
  address: string;
  dateLabel: string;
  timeLabel: string;
  tourNumber: number;
  totalTours: number;
  listingUrl?: string;
  landlordEmail?: string;
}): string {
  const { tenantName, address, dateLabel, timeLabel, tourNumber, totalTours } = params;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=Hedvig+Letters+Serif:opsz@12..24&display=swap');
</style>
</head>
<body style="margin:0;padding:0;background:#F7F5F2;">

<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;max-width:580px;margin:0 auto;color:#1c1917;background:#F7F5F2;padding:28px 0">

  <!-- Header -->
  <div style="background:linear-gradient(140deg,#b83b0a 0%,#ea580c 60%,#f97316 100%);padding:36px 36px 32px;border-radius:16px 16px 0 0">
    <p style="margin:0 0 18px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.6)">Nostos</p>
    <table style="border-collapse:collapse;width:100%"><tr>
      <td style="vertical-align:middle;width:52px">
        <div style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.18);text-align:center;line-height:44px">
          <span style="color:#fff;font-size:22px;font-weight:700;">&#10003;</span>
        </div>
      </td>
      <td style="vertical-align:middle;padding-left:8px">
        <p style="margin:0;font-size:28px;font-weight:400;color:#fff;line-height:1.15;font-family:'Hedvig Letters Serif',Georgia,serif;">Tour ${tourNumber} of ${totalTours} confirmed</p>
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

    <!-- Tour details card -->
    <div style="border-left:4px solid #ea580c;background:#fff7ed;border-radius:0 12px 12px 0;padding:22px 24px;margin:0 0 20px">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#92400e">Tour details</p>
      <p style="margin:0 0 20px;font-size:20px;font-weight:400;color:#1c1917;line-height:1.3;font-family:'Hedvig Letters Serif',Georgia,serif;">${address}</p>
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
      <!-- Get directions -->
      <a href="${mapsUrl}" style="display:inline-block;margin-top:6px;padding:10px 20px;background:#C2410C;color:#fff;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">Get directions &rarr;</a>
    </div>

    <!-- What to expect -->
    <div style="border:1px solid #e7e5e4;border-radius:12px;padding:20px 24px;margin:0 0 28px">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#a8a29e">What to expect</p>
      <p style="margin:0 0 8px;font-size:14px;color:#1c1917;line-height:1.6">
        <span style="color:#C2410C;font-weight:700;margin-right:8px">&#10003;</span>Your identity has already been shared with the landlord — no documents needed at the door.
      </p>
      <p style="margin:0 0 8px;font-size:14px;color:#1c1917;line-height:1.6">
        <span style="color:#C2410C;font-weight:700;margin-right:8px">&#10003;</span>Plan for about 30 minutes.
      </p>
      <p style="margin:0;font-size:14px;color:#1c1917;line-height:1.6">
        <span style="color:#C2410C;font-weight:700;margin-right:8px">&#10003;</span>Need to reschedule? Reply to this email and we'll sort it out.
      </p>
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

</div>
</body>
</html>`.trim();
}

function buildLandlordTourEmail(params: {
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
      <div style="margin:0 0 6px">
        <span style="font-size:18px;font-weight:700;color:#1c1917;margin-right:10px">${tenantName}</span>
        <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;letter-spacing:0.02em;vertical-align:middle">&#10003; Identity verified</span>
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

    <!-- Tour card -->
    <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:10px;padding:20px 24px;margin:0 0 20px">
      <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#78716c">Scheduled tour</p>
      <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1c1917">${address}</p>
      <table style="border-collapse:collapse;width:100%">
        <tr>
          <td style="padding:4px 0;font-size:12px;font-weight:600;color:#78716c;width:56px">Date</td>
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
    <a href="${appBaseUrl}/nostos/landlord" style="display:block;text-align:center;padding:14px 24px;background:linear-gradient(135deg,#C2410C,#ea580c);color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;margin:0 0 20px">View in Dashboard</a>

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
  const toOverride = process.env.RESEND_TO_OVERRIDE?.trim();
  const appBaseUrl = process.env.NEXTAUTH_URL?.trim() ?? "http://localhost:8081";
  const resolveRecipient = (addr: string) => toOverride ?? addr;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { tours, tenantEmail, tenantName, availabilityNote } = body as {
    tours?: TourRequest[];
    tenantEmail?: string;
    tenantName?: string;
    availabilityNote?: string;
  };

  if (!Array.isArray(tours) || tours.length === 0 || !tenantEmail) {
    return NextResponse.json(
      { error: "tours[] and tenantEmail are required." },
      { status: 400 }
    );
  }

  const displayName = tenantName ?? tenantEmail.split("@")[0];
  const slots = pickTourSlots(tours.length, availabilityNote);
  const scheduledTours: ScheduledTour[] = [];
  const warnings: string[] = [];

  if (!apiKey) {
    console.warn(
      "[schedule-tours] RESEND_API_KEY missing — skipping email sends; returning scheduledTours only"
    );
    warnings.push("emails_skipped_resend_api_key_missing");
    for (let i = 0; i < tours.length; i++) {
      const tour = tours[i];
      const slot = slots[i];
      scheduledTours.push({
        address: tour.listingAddress,
        listingId: tour.listingId,
        dateLabel: formatDate(slot),
        timeLabel: formatTime(slot),
        viewingDate: slot.toISOString(),
      });
    }
    return NextResponse.json({ scheduledTours, warnings });
  }

  const resend = new Resend(apiKey);
  const orgEmail = fromEmail.includes("<") ? fromEmail.split("<")[1].replace(">", "") : fromEmail;

  const errors: string[] = [];

  for (let i = 0; i < tours.length; i++) {
    const tour = tours[i];
    const slot = slots[i];
    const dateLabel = formatDate(slot);
    const timeLabel = formatTime(slot);
    const uid = `nostos-tour-${Date.now()}-${i}@nostos-app`;

    const attendees = [tenantEmail, ...(tour.landlordEmail ? [tour.landlordEmail] : [])];
    const icsContent = buildIcs({
      uid,
      summary: `Apartment Tour: ${tour.listingAddress}`,
      description: `Tour scheduled for ${displayName} at ${tour.listingAddress} via Nostos.`,
      location: tour.listingAddress,
      start: slot,
      durationMinutes: 30,
      organizerEmail: orgEmail,
      attendeeEmails: attendees,
    });
    const icsBase64 = Buffer.from(icsContent).toString("base64");

    // Tenant email
    try {
      await resend.emails.send({
        from: fromEmail,
        to: resolveRecipient(tenantEmail),
        subject: `Tour confirmed: ${tour.listingAddress}`,
        html: buildTourEmail({
          tenantName: displayName,
          address: tour.listingAddress,
          dateLabel,
          timeLabel,
          tourNumber: i + 1,
          totalTours: tours.length,
          listingUrl: tour.listingUrl,
          landlordEmail: tour.landlordEmail,
        }),
        attachments: [{ filename: "tour.ics", content: icsBase64 }],
      });
    } catch (e) {
      console.error(`[schedule-tours] tenant email ${i} failed:`, e);
      errors.push(`tenant_email_${i}_failed`);
    }

    // Landlord email (optional)
    if (tour.landlordEmail) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: resolveRecipient(tour.landlordEmail),
          subject: `New verified applicant: ${tour.listingAddress}`,
          html: buildLandlordTourEmail({
            tenantName: displayName,
            tenantEmail,
            address: tour.listingAddress,
            dateLabel,
            timeLabel,
            listingUrl: tour.listingUrl,
            appBaseUrl,
          }),
          attachments: [{ filename: "tour.ics", content: icsBase64 }],
        });
      } catch (e) {
        console.error(`[schedule-tours] landlord email ${i} failed:`, e);
        errors.push(`landlord_email_${i}_failed`);
      }
    }

    scheduledTours.push({
      address: tour.listingAddress,
      listingId: tour.listingId,
      dateLabel,
      timeLabel,
      viewingDate: slot.toISOString(),
    });
  }

  // Rental applications are created once in the TEE when the renter taps "Approve & Apply"
  // (POST /api/nostos/book from the Nostos flow). Calling nostos/book here too duplicated rows
  // and bypassed Next.js tourDateStore enrichment.

  return NextResponse.json({
    scheduledTours,
    ...(errors.length ? { warnings: errors } : {}),
  });
}
