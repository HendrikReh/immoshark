import type { Database } from "bun:sqlite";

export function migrate(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS immobilien (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      strasse TEXT NOT NULL,
      hausnummer TEXT NOT NULL,
      plz TEXT NOT NULL,
      ort TEXT NOT NULL,
      preis REAL,
      wohnflaeche REAL,
      grundstuecksflaeche REAL,
      zimmeranzahl REAL,
      typ TEXT NOT NULL CHECK(typ IN ('wohnung','haus','grundstueck','gewerbe')),
      baujahr INTEGER,
      beschreibung TEXT,
      provision TEXT,
      energieausweis_klasse TEXT CHECK(energieausweis_klasse IN ('A+','A','B','C','D','E','F','G','H')),
      energieausweis_verbrauch REAL,
      kontakt_name TEXT,
      kontakt_telefon TEXT,
      kontakt_email TEXT,
      expose_nummer TEXT UNIQUE,
      notizen TEXT,
      veroeffentlicht TEXT,
      status TEXT NOT NULL DEFAULT 'verfuegbar' CHECK(status IN ('verfuegbar','reserviert','verkauft')),
      erstellt_am TEXT NOT NULL DEFAULT (datetime('now')),
      aktualisiert_am TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_immobilien_ort ON immobilien(ort);
    CREATE INDEX IF NOT EXISTS idx_immobilien_plz ON immobilien(plz);
    CREATE INDEX IF NOT EXISTS idx_immobilien_typ ON immobilien(typ);
    CREATE INDEX IF NOT EXISTS idx_immobilien_status ON immobilien(status);
    CREATE INDEX IF NOT EXISTS idx_immobilien_preis ON immobilien(preis);
    CREATE INDEX IF NOT EXISTS idx_immobilien_kontakt_name ON immobilien(kontakt_name);

    CREATE TABLE IF NOT EXISTS immobilien_bilder (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      immobilie_id INTEGER NOT NULL REFERENCES immobilien(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      beschreibung TEXT,
      reihenfolge INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Add columns if missing (migration for existing DBs)
  const cols = db.query("PRAGMA table_info(immobilien)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "notizen")) {
    db.exec("ALTER TABLE immobilien ADD COLUMN notizen TEXT");
  }
  if (!cols.some((c) => c.name === "veroeffentlicht")) {
    db.exec("ALTER TABLE immobilien ADD COLUMN veroeffentlicht TEXT");
  }

  // FTS5: drop and recreate to include all searchable text fields
  // (notizen, provision, typ, status added to the index)
  const ftsExists = db
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name='immobilien_fts'")
    .get();

  // Check if FTS has the notizen column by inspecting its schema
  let needsRebuild = !ftsExists;
  if (ftsExists) {
    const ftsSchema = db
      .query("SELECT sql FROM sqlite_master WHERE type='table' AND name='immobilien_fts'")
      .get() as { sql: string } | null;
    if (ftsSchema && !ftsSchema.sql.includes("notizen")) {
      // Drop old FTS + triggers and recreate
      db.exec("DROP TRIGGER IF EXISTS immobilien_ai");
      db.exec("DROP TRIGGER IF EXISTS immobilien_ad");
      db.exec("DROP TRIGGER IF EXISTS immobilien_au");
      db.exec("DROP TABLE IF EXISTS immobilien_fts");
      needsRebuild = true;
    }
  }

  if (needsRebuild) {
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS immobilien_fts USING fts5(
        strasse, hausnummer, plz, ort, beschreibung, kontakt_name,
        kontakt_telefon, kontakt_email, expose_nummer, notizen,
        provision, typ, status,
        content='immobilien',
        content_rowid='id',
        tokenize='unicode61'
      );
    `);

    // Populate FTS from existing data
    db.exec(`
      INSERT INTO immobilien_fts(rowid, strasse, hausnummer, plz, ort, beschreibung,
        kontakt_name, kontakt_telefon, kontakt_email, expose_nummer, notizen,
        provision, typ, status)
      SELECT id, strasse, hausnummer, plz, ort, beschreibung,
        kontakt_name, kontakt_telefon, kontakt_email, expose_nummer, notizen,
        provision, typ, status
      FROM immobilien
    `);
  }

  // Sync triggers
  const triggerExists = db
    .query("SELECT name FROM sqlite_master WHERE type='trigger' AND name='immobilien_ai'")
    .get();

  if (!triggerExists) {
    const ftsCols = `strasse, hausnummer, plz, ort, beschreibung, kontakt_name,
      kontakt_telefon, kontakt_email, expose_nummer, notizen, provision, typ, status`;

    db.exec(`
      CREATE TRIGGER immobilien_ai AFTER INSERT ON immobilien BEGIN
        INSERT INTO immobilien_fts(rowid, ${ftsCols})
        VALUES (new.id, new.strasse, new.hausnummer, new.plz, new.ort, new.beschreibung,
          new.kontakt_name, new.kontakt_telefon, new.kontakt_email, new.expose_nummer,
          new.notizen, new.provision, new.typ, new.status);
      END;

      CREATE TRIGGER immobilien_ad AFTER DELETE ON immobilien BEGIN
        INSERT INTO immobilien_fts(immobilien_fts, rowid, ${ftsCols})
        VALUES ('delete', old.id, old.strasse, old.hausnummer, old.plz, old.ort, old.beschreibung,
          old.kontakt_name, old.kontakt_telefon, old.kontakt_email, old.expose_nummer,
          old.notizen, old.provision, old.typ, old.status);
      END;

      CREATE TRIGGER immobilien_au AFTER UPDATE ON immobilien BEGIN
        INSERT INTO immobilien_fts(immobilien_fts, rowid, ${ftsCols})
        VALUES ('delete', old.id, old.strasse, old.hausnummer, old.plz, old.ort, old.beschreibung,
          old.kontakt_name, old.kontakt_telefon, old.kontakt_email, old.expose_nummer,
          old.notizen, old.provision, old.typ, old.status);
        INSERT INTO immobilien_fts(rowid, ${ftsCols})
        VALUES (new.id, new.strasse, new.hausnummer, new.plz, new.ort, new.beschreibung,
          new.kontakt_name, new.kontakt_telefon, new.kontakt_email, new.expose_nummer,
          new.notizen, new.provision, new.typ, new.status);
      END;
    `);
  }
}
