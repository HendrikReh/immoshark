# data/

Daten-Verzeichnis für die SQLite-Datenbank und Testdaten.

## Dateien

| Datei | Versioniert | Beschreibung |
|-------|-------------|--------------|
| `immoshark.db` | nein (.gitignore) | Produktions-Datenbank. Wird beim ersten Serverstart automatisch erstellt und migriert. |
| `beispiel-immobilien.csv` | ja | 500 realistische Beispiel-Immobilien im deutschen CSV-Format (`;`-Trennzeichen, Dezimalkomma) |
| `generate-csv.ts` | ja | Generator-Script für die Beispiel-CSV |

## Datenbank

Die SQLite-Datenbank (`immoshark.db`) wird **nicht** ins Repository eingecheckt. Sie wird automatisch erstellt, wenn der Server zum ersten Mal startet:

```bash
bun run dev          # Erstellt DB + migriert automatisch
bun run seed         # Lädt 6 Basis-Immobilien (optional)
```

### Backup

```bash
# Datei kopieren (Server darf laufen — WAL-Modus ist crash-sicher)
cp data/immoshark.db data/immoshark_backup_$(date +%Y%m%d).db
```

### Zurücksetzen

```bash
rm data/immoshark.db data/immoshark.db-wal data/immoshark.db-shm
bun run dev          # Erstellt frische DB
bun run seed         # Optional: Testdaten laden
```

## CSV-Generator

Generiert 500 Beispiel-Immobilien mit realistischen deutschen Daten:

```bash
bun data/generate-csv.ts
```

### Generierte Daten

- **30 Städte** mit korrekten PLZ-Bereichen und Vorwahlen
- **4 Objekttypen**: Wohnung (häufig), Haus, Grundstück, Gewerbe
- **Realistische Preise**: typ-abhängige Spannen (z.B. Wohnung 85k–750k, Haus 250k–1.5M)
- **40 Kontakte** werden über die Datensätze verteilt (wie in der Praxis)
- **Deutsches Format**: Dezimalkomma (`1.234,56`), Semikolon-Trennzeichen
- **Exposé-Nummern**: Eindeutig pro Datensatz (`IS-2024-XXXX`)
- **Notizen**: Realistische Makler-Notizen (Besichtigungen, Finanzierung, etc.)

### CSV-Spalten

```
Straße;Hausnr;PLZ;Ort;Preis;Wohnfläche;Grundstücksfläche;Zimmer;Typ;
Baujahr;Beschreibung;Provision;Energieausweis-Klasse;Energieverbrauch;
Kontakt Name;Kontakt Telefon;Kontakt E-Mail;Exposé-Nr;Notizen;Status
```

Die CSV kann über den **CSV-Import** in der Anwendung importiert werden. Das Spalten-Mapping wird dabei automatisch erkannt.
