import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { createTestDb, createTestServer } from "../helpers.js";
import type { Database } from "bun:sqlite";

let db: Database;
let baseUrl: string;
let close: () => Promise<void>;

beforeAll(() => {
  db = createTestDb();
  const srv = createTestServer();
  baseUrl = srv.baseUrl;
  close = srv.close;
});

afterAll(async () => {
  await close();
});

beforeEach(() => {
  db.exec("DELETE FROM immobilien");
});

function makeCsvBlob(content: string): Blob {
  return new Blob([content], { type: "text/csv" });
}

describe("CSV Upload", () => {
  it("POST /api/csv/upload → returns headers, preview, session_id", async () => {
    const csv = "Strasse;Nr;PLZ;Ort;Typ\nHauptstr.;1;10115;Berlin;wohnung\nGartenweg;5;80331;München;haus";
    const form = new FormData();
    form.append("file", makeCsvBlob(csv), "test.csv");

    const res = await fetch(`${baseUrl}/api/csv/upload`, { method: "POST", body: form });
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(data.session_id).toBeDefined();
    expect(data.headers).toEqual(["Strasse", "Nr", "PLZ", "Ort", "Typ"]);
    expect(data.preview).toHaveLength(2);
    expect(data.total_rows).toBe(2);
  });

  it("POST /api/csv/upload → 400 without file", async () => {
    const form = new FormData();
    const res = await fetch(`${baseUrl}/api/csv/upload`, { method: "POST", body: form });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("NO_FILE");
  });
});

describe("CSV Import", () => {
  it("POST /api/csv/import → imports with mapping", async () => {
    // Step 1: Upload
    const csv = "Strasse;Nr;PLZ;Ort;Typ\nImportstr.;1;10115;Berlin;wohnung";
    const form = new FormData();
    form.append("file", makeCsvBlob(csv), "test.csv");

    const uploadRes = await fetch(`${baseUrl}/api/csv/upload`, { method: "POST", body: form });
    const { data: uploadData } = await uploadRes.json();

    // Step 2: Import
    const importRes = await fetch(`${baseUrl}/api/csv/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: uploadData.session_id,
        mapping: {
          Strasse: "strasse",
          Nr: "hausnummer",
          PLZ: "plz",
          Ort: "ort",
          Typ: "typ",
        },
      }),
    });
    expect(importRes.status).toBe(200);

    const { data } = await importRes.json();
    expect(data.imported).toBe(1);
    expect(data.skipped).toBe(0);

    // Verify it's in DB
    const row = db.query("SELECT * FROM immobilien WHERE strasse = 'Importstr.'").get();
    expect(row).not.toBeNull();
  });

  it("POST /api/csv/import → 400 for invalid session_id", async () => {
    const res = await fetch(`${baseUrl}/api/csv/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: "nonexistent-session",
        mapping: { Strasse: "strasse" },
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("SESSION_NOT_FOUND");
  });

  it("POST /api/csv/import → 400 for missing session_id", async () => {
    const res = await fetch(`${baseUrl}/api/csv/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mapping: { Strasse: "strasse" } }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("SESSION_NOT_FOUND");
  });

  it("POST /api/csv/import → 400 for missing session_id (suggest-mapping)", async () => {
    const res = await fetch(`${baseUrl}/api/csv/suggest-mapping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: "nonexistent-session" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("SESSION_NOT_FOUND");
  });

  it("POST /api/csv/import → 400 for invalid mapping", async () => {
    // Upload first to get valid session
    const csv = "Col1\nVal1";
    const form = new FormData();
    form.append("file", makeCsvBlob(csv), "test.csv");
    const uploadRes = await fetch(`${baseUrl}/api/csv/upload`, { method: "POST", body: form });
    const { data: uploadData } = await uploadRes.json();

    const res = await fetch(`${baseUrl}/api/csv/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: uploadData.session_id,
        mapping: { Col1: "invalid_field" },
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_MAPPING");
  });
});
