import { parse } from "csv-parse/sync";
import type { ImmobilieCreateDTO, CsvColumnMapping } from "@immoshark/shared";
import { immobilieCreateSchema } from "@immoshark/shared";
import { createImmobilie } from "./immobilien.service.js";

function detectDelimiter(content: string): string {
  const firstLine = content.split("\n")[0] || "";
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons > commas ? ";" : ",";
}

function parseGermanNumber(value: string): number | null {
  if (!value || value.trim() === "") return null;
  // German: 1.234,56 → 1234.56
  const cleaned = value.trim().replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function parseCsvContent(content: string) {
  const delimiter = detectDelimiter(content);
  const records: string[][] = parse(content, {
    delimiter,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  if (records.length === 0) throw new Error("CSV-Datei ist leer");

  const headers = records[0];
  const dataRows = records.slice(1);
  const preview = dataRows.slice(0, 5);

  return { headers, preview, total_rows: dataRows.length };
}

const NUMERIC_FIELDS = new Set([
  "preis",
  "wohnflaeche",
  "grundstuecksflaeche",
  "zimmeranzahl",
  "energieausweis_verbrauch",
  "baujahr",
]);

const DATE_FIELDS = new Set(["veroeffentlicht"]);

function parseGermanDate(value: string): string | null {
  if (!value || value.trim() === "") return null;
  const trimmed = value.trim();
  // Already ISO: 2026-01-15
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // German: 15.01.2026
  const match = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return null;
}

export function importCsvData(
  content: string,
  mapping: CsvColumnMapping
): { imported: number; skipped: number; errors: string[] } {
  const delimiter = detectDelimiter(content);
  const records: string[][] = parse(content, {
    delimiter,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  const headers = records[0];
  const dataRows = records.slice(1);
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rawObj: Record<string, unknown> = {};

    for (let col = 0; col < headers.length; col++) {
      const csvHeader = headers[col];
      const targetField = mapping[csvHeader];
      if (!targetField || !row[col]) continue;

      const value = row[col].trim();
      if (!value) continue;

      if (NUMERIC_FIELDS.has(targetField)) {
        rawObj[targetField] = parseGermanNumber(value);
      } else if (DATE_FIELDS.has(targetField)) {
        rawObj[targetField] = parseGermanDate(value);
      } else {
        rawObj[targetField] = value;
      }
    }

    const result = immobilieCreateSchema.safeParse(rawObj);
    if (result.success) {
      try {
        createImmobilie(result.data as ImmobilieCreateDTO);
        imported++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Zeile ${i + 2}: ${msg}`);
        skipped++;
      }
    } else {
      const msgs = result.error.errors.map((e) => e.message).join(", ");
      errors.push(`Zeile ${i + 2}: ${msgs}`);
      skipped++;
    }
  }

  return { imported, skipped, errors };
}
