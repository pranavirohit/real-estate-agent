/**
 * Parse free-text rental search (agent chat) into query params for GET /api/listings.
 */

export type ParsedRentalSearch = {
  location: string;
  maxPrice: number;
  beds: number;
};

const DEFAULT_LOCATION = "Brooklyn, NY";
const DEFAULT_MAX_PRICE = 5000;
const DEFAULT_BEDS = 1;

/** $3000, 3000/mo, under 3000, 3k */
function parseMaxPrice(text: string): number | undefined {
  const lower = text.toLowerCase();

  const under = /(?:under|below|max|less than)\s*\$?\s*([\d,]+)\s*(?:k)?/i.exec(
    text
  );
  if (under) {
    let n = parseInt(under[1].replace(/,/g, ""), 10);
    if (!Number.isNaN(n)) {
      if (lower.includes("k") && n < 100) n *= 1000;
      return n;
    }
  }

  const dollar = /\$\s*([\d,]+)/g;
  let best: number | undefined;
  let m: RegExpExecArray | null;
  while ((m = dollar.exec(text)) !== null) {
    let n = parseInt(m[1].replace(/,/g, ""), 10);
    if (!Number.isNaN(n)) {
      if (n >= 100 && n <= 99999) best = n;
    }
  }
  if (best !== undefined) return best;

  const plain = /(?:^|\s)(\d{3,5})(?:\s*\/mo|\s*per\s*month)?(?:\s|$)/i.exec(
    text
  );
  if (plain) {
    const n = parseInt(plain[1], 10);
    if (!Number.isNaN(n) && n >= 500 && n <= 50000) return n;
  }

  const kMatch = /(?:^|\s)(\d)\s*k(?:\s|$)/i.exec(lower);
  if (kMatch) {
    const n = parseInt(kMatch[1], 10) * 1000;
    if (!Number.isNaN(n)) return n;
  }

  return undefined;
}

/** 2 bedroom, 2br, 2 bd */
function parseBeds(text: string): number | undefined {
  const m =
    /(\d+)\s*(?:bd|br|bed|bedroom|bedrooms)\b/i.exec(text) ||
    /(\d+)\s*-\s*(?:bd|br|bed|bedroom)\b/i.exec(text);
  if (m) {
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n) && n >= 0 && n <= 10) return Math.max(0, n);
  }
  return undefined;
}

/** City, ST or known borough names */
function parseLocation(text: string): string {
  const lower = text.toLowerCase();

  const cityState = /\b([A-Za-z][A-Za-z\s]+),\s*([A-Z]{2})\b/.exec(text);
  if (cityState) {
    const city = cityState[1].trim();
    const st = cityState[2];
    if (city.length >= 2 && st.length === 2) return `${city}, ${st}`;
  }

  if (/\bbrooklyn\b/i.test(text)) return "Brooklyn, NY";
  if (/\bmanhattan\b|\bnew york\b(?!\s*,)/i.test(text)) return "New York, NY";
  if (/\bqueens\b/i.test(text)) return "Queens, NY";
  if (/\bbronx\b/i.test(text)) return "Bronx, NY";
  if (/\bstaten island\b/i.test(text)) return "Staten Island, NY";

  return DEFAULT_LOCATION;
}

export function parseRentalSearchQuery(raw: string): ParsedRentalSearch {
  const trimmed = raw.trim();
  return {
    location: parseLocation(trimmed),
    maxPrice: parseMaxPrice(trimmed) ?? DEFAULT_MAX_PRICE,
    beds: parseBeds(trimmed) ?? DEFAULT_BEDS,
  };
}
