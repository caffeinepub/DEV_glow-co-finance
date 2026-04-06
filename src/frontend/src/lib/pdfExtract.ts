/**
 * Client-side PDF text extraction and bill data parsing.
 * Extracts readable text from raw PDF bytes and applies regex heuristics
 * to find supplier name, invoice number, date, amount, and VAT.
 */

export interface ExtractedBillData {
  supplierName?: string;
  invoiceNumber?: string;
  date?: string; // ISO yyyy-MM-dd
  amount?: number; // ex-VAT
  vatAmount?: number;
  confidence: "full" | "partial" | "failed";
}

/** Pull all visible text runs out of a PDF binary buffer. */
function extractTextFromPdf(bytes: Uint8Array): string {
  const raw = new TextDecoder("latin1").decode(bytes);

  // Collect text inside BT...ET blocks (PDF text operators)
  const textBlocks: string[] = [];

  // Match Tj / TJ text strings
  const tjRegex = /\(([^)]*)\)\s*Tj/g;
  for (const m of raw.matchAll(tjRegex)) {
    textBlocks.push(m[1]);
  }

  // TJ arrays
  const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
  for (const m of raw.matchAll(tjArrayRegex)) {
    const inner = m[1].replace(/\([^)]*\)/g, (s) => s.slice(1, -1));
    textBlocks.push(inner);
  }

  // Streams with uncompressed text (often form data)
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  for (const m of raw.matchAll(streamRegex)) {
    const s = m[1];
    // Only include if it looks like readable text (not binary)
    if (/[\x20-\x7e]{6,}/.test(s)) {
      textBlocks.push(s);
    }
  }

  return textBlocks
    .join(" ")
    .replace(/\\r|\\n|\\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Convert common UK date formats to ISO yyyy-MM-dd */
function parseDate(raw: string): string | undefined {
  // dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
  const dmy = raw.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmy) {
    const [, d, mo, y] = dmy;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // yyyy-mm-dd
  const iso = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // "15 January 2024" or "15 Jan 2024"
  const months: Record<string, string> = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };
  const longDate = raw.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (longDate) {
    const mo = months[longDate[2].toLowerCase()];
    if (mo) return `${longDate[3]}-${mo}-${longDate[1].padStart(2, "0")}`;
  }
  return undefined;
}

/** Strip PDF escape sequences and common garbage */
function clean(s: string): string {
  return s
    .replace(/\\[0-9]{3}/g, "") // octal escapes
    .replace(/[^\x20-\x7e]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Main extraction function — call with PDF ArrayBuffer */
export function extractBillDataFromPdf(buffer: ArrayBuffer): ExtractedBillData {
  const bytes = new Uint8Array(buffer);

  // Quick sanity check — PDF signature
  const header = new TextDecoder("ascii").decode(bytes.slice(0, 5));
  if (!header.startsWith("%PDF")) {
    return { confidence: "failed" };
  }

  const text = extractTextFromPdf(bytes);

  if (text.length < 20) {
    // Possibly a scanned/image-only PDF — can't extract
    return { confidence: "failed" };
  }

  const result: ExtractedBillData = { confidence: "full" };
  let extracted = 0;

  // ── Invoice number ──────────────────────────────────────────────────────────
  const invNoPattern =
    /(?:invoice\s*(?:no|number|#|num)?[:.\s]*|inv\s*(?:no|#)?[:.\s]*)([A-Z0-9\-\/]{3,20})/i;
  const invMatch = text.match(invNoPattern);
  if (invMatch) {
    result.invoiceNumber = clean(invMatch[1]);
    extracted++;
  }

  // ── Date ────────────────────────────────────────────────────────────────────
  const datePattern =
    /(?:invoice\s+date|date\s+of\s+invoice|date\s+issued|bill\s+date|issue\s+date|date)[:.\s]+([^\n]{5,25})/i;
  const dateMatch = text.match(datePattern);
  if (dateMatch) {
    const parsed = parseDate(dateMatch[1]);
    if (parsed) {
      result.date = parsed;
      extracted++;
    }
  }
  // Fallback: first standalone date in the document
  if (!result.date) {
    const standaloneDates = text.match(
      /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/g,
    );
    if (standaloneDates?.[0]) {
      const parsed = parseDate(standaloneDates[0]);
      if (parsed) result.date = parsed;
    }
  }

  // ── Supplier name ───────────────────────────────────────────────────────────
  // Heuristic: first capitalised 2-4 word sequence near top of text or after "From:"
  const fromMatch = text.match(
    /(?:from|supplier|vendor|company)[:.\s]+([A-Z][^\n\r,.]{3,40})/i,
  );
  if (fromMatch) {
    result.supplierName = clean(fromMatch[1]).substring(0, 50);
    extracted++;
  } else {
    // First multi-word title-case sequence
    const titleCase = text.match(
      /\b([A-Z][a-z]+(?:\s+(?:&|and|Ltd|Limited|plc|LLP|Co\.?|Inc\.?|[A-Z][a-z]+))+)\b/,
    );
    if (titleCase) {
      result.supplierName = clean(titleCase[1]).substring(0, 50);
    }
  }

  // ── Amount (ex-VAT) ─────────────────────────────────────────────────────────
  const amtPatterns = [
    /(?:sub[\s-]?total|net\s+amount|amount\s+(?:ex\.?\s*vat|before\s*vat)|total\s+(?:ex\.?\s*vat|before\s*vat))[:.\s£]*([0-9,]+\.[0-9]{2})/i,
    /(?:total|amount\s+due|balance\s+due|payment\s+due)[:.\s£]*([0-9,]+\.[0-9]{2})/i,
  ];
  for (const pat of amtPatterns) {
    const amtMatch = text.match(pat);
    if (amtMatch) {
      const num = Number.parseFloat(amtMatch[1].replace(/,/g, ""));
      if (!Number.isNaN(num) && num > 0) {
        result.amount = num;
        extracted++;
        break;
      }
    }
  }

  // ── VAT amount ──────────────────────────────────────────────────────────────
  const vatMatch = text.match(
    /(?:vat\s+(?:amount|charged|total)|tax\s+amount)[:.\s£]*([0-9,]+\.[0-9]{2})/i,
  );
  if (vatMatch) {
    const num = Number.parseFloat(vatMatch[1].replace(/,/g, ""));
    if (!Number.isNaN(num) && num >= 0) {
      result.vatAmount = num;
      extracted++;
    }
  }

  // ── Confidence ──────────────────────────────────────────────────────────────
  if (extracted === 0) {
    result.confidence = "failed";
  } else if (extracted < 3) {
    result.confidence = "partial";
  } else {
    result.confidence = "full";
  }

  return result;
}
