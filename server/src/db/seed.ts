import { getDb } from "./database.js";

const db = getDb();

// Clear existing data
db.exec("DELETE FROM immobilien_bilder");
db.exec("DELETE FROM immobilien");

const immobilien = [
  {
    strasse: "Musterstraße",
    hausnummer: "12",
    plz: "80331",
    ort: "München",
    preis: 450000,
    wohnflaeche: 85,
    grundstuecksflaeche: null,
    zimmeranzahl: 3,
    typ: "wohnung",
    baujahr: 2015,
    beschreibung: "Moderne 3-Zimmer-Wohnung mit Balkon und Tiefgaragenstellplatz in zentraler Lage.",
    provision: "3,57% inkl. MwSt.",
    energieausweis_klasse: "B",
    energieausweis_verbrauch: 78,
    kontakt_name: "Max Mustermann",
    kontakt_telefon: "+49 89 12345678",
    kontakt_email: "max@immoshark.de",
    expose_nummer: "IS-2024-001",
    notizen: "Besichtigung am 15.03. vereinbart. Käufer sehr interessiert.",
    veroeffentlicht: "2026-01-15",
    status: "verfuegbar",
  },
  {
    strasse: "Gartenweg",
    hausnummer: "5a",
    plz: "22085",
    ort: "Hamburg",
    preis: 680000,
    wohnflaeche: 145,
    grundstuecksflaeche: 420,
    zimmeranzahl: 5,
    typ: "haus",
    baujahr: 1998,
    beschreibung: "Freistehendes Einfamilienhaus mit großem Garten, Doppelgarage und Keller.",
    provision: "Provisionsfrei",
    energieausweis_klasse: "D",
    energieausweis_verbrauch: 142,
    kontakt_name: "Anna Schmidt",
    kontakt_telefon: "+49 40 87654321",
    kontakt_email: "anna@immoshark.de",
    expose_nummer: "IS-2024-002",
    veroeffentlicht: "2026-02-01",
    status: "verfuegbar",
  },
  {
    strasse: "Berliner Allee",
    hausnummer: "78",
    plz: "10115",
    ort: "Berlin",
    preis: 320000,
    wohnflaeche: 62,
    grundstuecksflaeche: null,
    zimmeranzahl: 2,
    typ: "wohnung",
    baujahr: 2020,
    beschreibung: "Stilvolle Altbau-Wohnung mit hohen Decken in Berlin-Mitte.",
    provision: "3,57% inkl. MwSt.",
    energieausweis_klasse: "A",
    energieausweis_verbrauch: 45,
    kontakt_name: "Thomas Weber",
    kontakt_telefon: "+49 30 11223344",
    kontakt_email: "thomas@immoshark.de",
    expose_nummer: "IS-2024-003",
    veroeffentlicht: "2025-12-10",
    status: "reserviert",
  },
  {
    strasse: "Industriestraße",
    hausnummer: "100",
    plz: "60327",
    ort: "Frankfurt",
    preis: 1200000,
    wohnflaeche: 350,
    grundstuecksflaeche: 800,
    zimmeranzahl: null,
    typ: "gewerbe",
    baujahr: 2010,
    beschreibung: "Repräsentative Gewerbefläche mit moderner Ausstattung, ideal für Büro oder Praxis.",
    provision: "Auf Anfrage",
    energieausweis_klasse: "C",
    energieausweis_verbrauch: 95,
    kontakt_name: "Lisa Braun",
    kontakt_telefon: "+49 69 55667788",
    kontakt_email: "lisa@immoshark.de",
    expose_nummer: "IS-2024-004",
    status: "verfuegbar",
  },
  {
    strasse: "Am Waldrand",
    hausnummer: "3",
    plz: "50933",
    ort: "Köln",
    preis: 195000,
    wohnflaeche: null,
    grundstuecksflaeche: 650,
    zimmeranzahl: null,
    typ: "grundstueck",
    baujahr: null,
    beschreibung: "Erschlossenes Baugrundstück in ruhiger Wohnlage am Stadtrand von Köln.",
    provision: "Provisionsfrei",
    energieausweis_klasse: null,
    energieausweis_verbrauch: null,
    kontakt_name: "Klaus Richter",
    kontakt_telefon: "+49 221 99887766",
    kontakt_email: "klaus@immoshark.de",
    expose_nummer: "IS-2024-005",
    status: "verfuegbar",
  },
  {
    strasse: "Schlossallee",
    hausnummer: "1",
    plz: "70173",
    ort: "Stuttgart",
    preis: 890000,
    wohnflaeche: 180,
    grundstuecksflaeche: 300,
    zimmeranzahl: 6,
    typ: "haus",
    baujahr: 1920,
    beschreibung: "Charmante Stadtvilla mit Jugendstil-Elementen, modernisiert, Parkett und Stuck.",
    provision: "5,95% inkl. MwSt.",
    energieausweis_klasse: "E",
    energieausweis_verbrauch: 165,
    kontakt_name: "Maria König",
    kontakt_telefon: "+49 711 33445566",
    kontakt_email: "maria@immoshark.de",
    expose_nummer: "IS-2024-006",
    status: "verkauft",
  },
];

const stmt = db.prepare(`
  INSERT INTO immobilien (
    strasse, hausnummer, plz, ort, preis, wohnflaeche, grundstuecksflaeche,
    zimmeranzahl, typ, baujahr, beschreibung, provision, energieausweis_klasse,
    energieausweis_verbrauch, kontakt_name, kontakt_telefon, kontakt_email,
    expose_nummer, notizen, veroeffentlicht, status
  ) VALUES (
    $strasse, $hausnummer, $plz, $ort, $preis, $wohnflaeche, $grundstuecksflaeche,
    $zimmeranzahl, $typ, $baujahr, $beschreibung, $provision, $energieausweis_klasse,
    $energieausweis_verbrauch, $kontakt_name, $kontakt_telefon, $kontakt_email,
    $expose_nummer, $notizen, $veroeffentlicht, $status
  )
`);

for (const immo of immobilien) {
  const params: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(immo)) {
    params[`$${key}`] = value;
  }
  stmt.run(params);
}

console.log(`Seeded ${immobilien.length} Immobilien.`);
