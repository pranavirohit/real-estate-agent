/**
 * Optional, opt-in OCR via Dedalus (`POST /v1/ocr`, Mistral OCR).
 *
 * PRIVACY TRADE-OFF: The TEE normally runs Tesseract locally, so the ID image
 * never leaves the trusted environment. Enabling this sends the image to Dedalus
 * (and its OCR provider). That is a deliberate choice — it gives much cleaner text
 * extraction at the cost of the image leaving the TEE. It is therefore OFF by
 * default and only used when DEDALUS_OCR is truthy AND DEDALUS_API_KEY is set.
 * The downstream parsing/attestation logic is unchanged: this only replaces the
 * raw-text step that feeds parseIDText().
 */

const DEDALUS_OCR_URL = 'https://api.dedaluslabs.ai/v1/ocr';
const DEDALUS_OCR_MODEL = 'mistral-ocr-latest';

/** True only when explicitly enabled and a key is present. */
export function isDedalusOcrEnabled(): boolean {
  const flag = process.env.DEDALUS_OCR?.trim().toLowerCase();
  const enabled = flag === '1' || flag === 'true' || flag === 'yes';
  return enabled && Boolean(process.env.DEDALUS_API_KEY?.trim());
}

/** Sniff an image/PDF MIME type from magic bytes so the data URI is correct. */
function detectMimeType(buf: Buffer): string {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (buf.length >= 4 && buf.toString('ascii', 0, 4) === '%PDF') {
    return 'application/pdf';
  }
  // Default to JPEG — the demo IDs are JPEGs.
  return 'image/jpeg';
}

interface OcrPage {
  index?: number;
  markdown?: string;
}

interface OcrResponse {
  pages?: OcrPage[];
  model?: string;
}

/**
 * Run Dedalus OCR on a base64 image (no data-URI prefix) and return the
 * concatenated markdown text. Throws on any failure so the caller can fall
 * back to local Tesseract.
 */
export async function extractTextViaDedalusOcr(strippedBase64: string): Promise<string> {
  const apiKey = process.env.DEDALUS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('DEDALUS_API_KEY not set');
  }

  const buf = Buffer.from(strippedBase64, 'base64');
  const mime = detectMimeType(buf);
  const dataUri = `data:${mime};base64,${strippedBase64}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(DEDALUS_OCR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEDALUS_OCR_MODEL,
        document: { type: 'document_url', document_url: dataUri },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Dedalus OCR HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as OcrResponse;
    const text = (data.pages ?? [])
      .map((p) => p.markdown ?? '')
      .join('\n')
      .trim();

    if (!text) {
      throw new Error('Dedalus OCR returned empty text');
    }
    return text;
  } finally {
    clearTimeout(timeout);
  }
}
