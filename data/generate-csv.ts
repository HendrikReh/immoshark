/**
 * Generates 500 realistic German real estate CSV records.
 * Run with: bun run data/generate-csv.ts
 */

// --- Data pools ---

const strassenPrefixes = [
  "Haupt", "Bahnhof", "Schiller", "Goethe", "Linden", "Berg", "Wald",
  "Wiesen", "Kirch", "Markt", "Schul", "Rosen", "Birken", "Eichen",
  "Tannen", "Kastanien", "Ahorn", "Buchen", "Erlen", "Ulmen",
  "Mühlen", "Brücken", "Turm", "Schloss", "Burg", "Kloster",
  "Dorf", "Feld", "Garten", "Park", "Ring", "Kaiser", "König",
  "Bismarck", "Beethoven", "Mozart", "Bach", "Händel", "Wagner",
  "Rathaus", "Brunnen", "Sonnen", "Mond", "Stern", "Blumen",
  "Heide", "Moor", "See", "Teich", "Fluss", "Rhein", "Elbe",
  "Donau", "Isar", "Spree", "Alster", "Weser", "Main", "Neckar",
];

const strassenSuffixes = ["straße", "weg", "gasse", "allee", "ring", "platz", "damm", "steig", "pfad"];

const orteUndPlz: [string, string, string][] = [
  ["München", "80", "+49 89"],
  ["Hamburg", "20", "+49 40"],
  ["Berlin", "10", "+49 30"],
  ["Köln", "50", "+49 221"],
  ["Frankfurt", "60", "+49 69"],
  ["Stuttgart", "70", "+49 711"],
  ["Düsseldorf", "40", "+49 211"],
  ["Leipzig", "04", "+49 341"],
  ["Dresden", "01", "+49 351"],
  ["Hannover", "30", "+49 511"],
  ["Nürnberg", "90", "+49 911"],
  ["Essen", "45", "+49 201"],
  ["Bremen", "28", "+49 421"],
  ["Dortmund", "44", "+49 231"],
  ["Bonn", "53", "+49 228"],
  ["Mannheim", "68", "+49 621"],
  ["Augsburg", "86", "+49 821"],
  ["Freiburg", "79", "+49 761"],
  ["Heidelberg", "69", "+49 6221"],
  ["Regensburg", "93", "+49 941"],
  ["Wiesbaden", "65", "+49 611"],
  ["Potsdam", "14", "+49 331"],
  ["Rostock", "18", "+49 381"],
  ["Kiel", "24", "+49 431"],
  ["Lübeck", "23", "+49 451"],
  ["Mainz", "55", "+49 6131"],
  ["Aachen", "52", "+49 241"],
  ["Karlsruhe", "76", "+49 721"],
  ["Münster", "48", "+49 251"],
  ["Ulm", "89", "+49 731"],
];

const vornamen = [
  "Thomas", "Stefan", "Michael", "Andreas", "Markus", "Christian", "Martin",
  "Peter", "Klaus", "Wolfgang", "Jürgen", "Frank", "Bernd", "Uwe", "Ralf",
  "Anna", "Sabine", "Monika", "Petra", "Claudia", "Susanne", "Brigitte",
  "Maria", "Lisa", "Eva", "Karin", "Renate", "Heike", "Julia", "Sandra",
  "Tobias", "Florian", "Daniel", "Jan", "Alexander", "Matthias", "Lukas",
  "Katharina", "Laura", "Sophia", "Hannah", "Lena", "Marie", "Sarah",
];

const nachnamen = [
  "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner",
  "Becker", "Schulz", "Hoffmann", "Schäfer", "Koch", "Bauer", "Richter",
  "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann",
  "Braun", "Krüger", "Hofmann", "Hartmann", "Lange", "Schmitt", "Werner",
  "Krause", "Meier", "Lehmann", "Schmid", "Schulze", "Maier", "Köhler",
  "Herrmann", "König", "Walter", "Huber", "Kaiser", "Peters",
];

type Typ = "wohnung" | "haus" | "grundstueck" | "gewerbe";

interface TypConfig {
  preisRange: [number, number];
  wohnflaecheRange: [number, number];
  grundstueckRange: [number, number];
  zimmerRange: [number, number];
  baujahrRange: [number, number];
  beschreibungen: string[];
}

const typConfigs: Record<Typ, TypConfig> = {
  wohnung: {
    preisRange: [85_000, 750_000],
    wohnflaecheRange: [28, 160],
    grundstueckRange: [0, 0],
    zimmerRange: [1, 5],
    baujahrRange: [1955, 2025],
    beschreibungen: [
      "Helle $Z-Zimmer-Wohnung mit Balkon in ruhiger Lage.",
      "Gepflegte Eigentumswohnung mit moderner Einbauküche und Stellplatz.",
      "Frisch renovierte Wohnung mit Parkettböden und Fußbodenheizung.",
      "Stilvolle Altbauwohnung mit hohen Decken und Stuck.",
      "Moderne Neubauwohnung mit offener Küche und bodentiefen Fenstern.",
      "Gemütliche Dachgeschosswohnung mit Galerie und Skyline-Blick.",
      "Barrierefreie Erdgeschosswohnung mit Terrasse und eigenem Garten.",
      "Loftartige Wohnung in saniertem Fabrikgebäude, Backsteinoptik.",
      "Sonnige Etagenwohnung in familienfreundlicher Wohngegend.",
      "Penthouse mit umlaufender Dachterrasse und Panoramablick.",
      "Ruhig gelegene Wohnung im Grünen mit Tiefgaragenstellplatz.",
      "Zentral gelegene Stadtwohnung, fußläufig zu allen Annehmlichkeiten.",
      "Charmante Maisonette-Wohnung über zwei Etagen mit Kamin.",
      "Kompakte Single-Wohnung mit durchdachtem Grundriss, ideal als Kapitalanlage.",
      "Großzügige Familienwohnung mit separatem Gäste-WC und Abstellraum.",
    ],
  },
  haus: {
    preisRange: [250_000, 1_500_000],
    wohnflaecheRange: [90, 300],
    grundstueckRange: [200, 1200],
    zimmerRange: [4, 8],
    baujahrRange: [1900, 2025],
    beschreibungen: [
      "Freistehendes Einfamilienhaus mit großem Garten und Doppelgarage.",
      "Gepflegtes Reihenhaus in familienfreundlicher Wohnlage.",
      "Charmante Stadtvilla mit Jugendstil-Elementen, kernsaniert.",
      "Moderner Neubau in energieeffizienter Bauweise, KfW-40-Standard.",
      "Doppelhaushälfte mit Carport und pflegeleichtem Vorgarten.",
      "Großzügiges Landhaus mit Pool, Sauna und Einliegerwohnung.",
      "Bungalow auf einer Ebene, ideal für barrierefreies Wohnen.",
      "Architektenhaus mit offenem Wohnkonzept und bodentiefen Fenstern.",
      "Renoviertes Fachwerkhaus mit modernem Anbau und historischem Charme.",
      "Zweifamilienhaus mit separaten Eingängen, ideal zur Kapitalanlage.",
      "Massives Einfamilienhaus mit Keller, Terrasse und Obstgarten.",
      "Reihenendhaus mit seitlichem Gartenanteil und Sonnenterrasse.",
      "Energetisch saniertes Siedlungshaus mit neuer Heizung und Dach.",
      "Repräsentatives Stadthaus in bevorzugter Wohnlage mit Garage.",
      "Holzhaus in ökologischer Bauweise mit Solarthermie und Regenwassernutzung.",
    ],
  },
  grundstueck: {
    preisRange: [50_000, 800_000],
    wohnflaecheRange: [0, 0],
    grundstueckRange: [300, 2500],
    zimmerRange: [0, 0],
    baujahrRange: [0, 0],
    beschreibungen: [
      "Voll erschlossenes Baugrundstück in ruhiger Wohnlage.",
      "Sonniges Eckgrundstück mit Südausrichtung, bebaubar nach §34 BauGB.",
      "Großes Grundstück am Ortsrand mit freiem Blick ins Grüne.",
      "Bauland in Neubaugebiet mit allen Anschlüssen, sofort bebaubar.",
      "Hanggrundstück mit Fernblick, ideal für Architektenhaus.",
      "Ebenes Grundstück in gewachsener Siedlung, ruhige Sackgassenlage.",
      "Grundstück mit Altbestand (Abriss geplant), zentrale Lage.",
      "Waldrandgrundstück mit altem Baumbestand und Bachlauf.",
      "Baugrundstück mit genehmigter Bauvoranfrage für Doppelhaus.",
      "Attraktives Grundstück in Seenähe, ideal für Ferienhausbebauung.",
    ],
  },
  gewerbe: {
    preisRange: [150_000, 3_000_000],
    wohnflaecheRange: [50, 800],
    grundstueckRange: [0, 2000],
    zimmerRange: [0, 0],
    baujahrRange: [1970, 2024],
    beschreibungen: [
      "Repräsentative Bürofläche in zentraler Lage mit guter ÖPNV-Anbindung.",
      "Moderne Praxisräume im Ärztehaus, barrierefrei und klimatisiert.",
      "Ladenfläche in frequentierter Einkaufsstraße mit großer Schaufensterfront.",
      "Produktionshalle mit Bürotrakt, Laderampe und ausreichend Parkplätzen.",
      "Gastronomie-Fläche mit voll ausgestatteter Küche und Außenbestuhlung.",
      "Lager- und Logistikfläche im Gewerbegebiet, Autobahnnähe.",
      "Coworking-geeignete Fläche im Loft-Stil mit Glasfaseranschluss.",
      "Werkstatt mit Hebebühne, Sozialräumen und separatem Büro.",
      "Atelier- und Showroom-Fläche in sanierter Industriehalle.",
      "Hotel-Gewerbeeinheit mit 15 Zimmern, Frühstücksraum und Rezeption.",
    ],
  },
};

const provisionen = [
  "3,57% inkl. MwSt.",
  "Provisionsfrei",
  "5,95% inkl. MwSt.",
  "3,57% inkl. MwSt.",
  "Provisionsfrei",
  "3,57% inkl. MwSt.",
  "Auf Anfrage",
  "2,38% inkl. MwSt.",
  "Provisionsfrei",
  "4,76% inkl. MwSt.",
];

const energieKlassen: { klasse: string; verbrauchRange: [number, number] }[] = [
  { klasse: "A+", verbrauchRange: [10, 30] },
  { klasse: "A", verbrauchRange: [30, 50] },
  { klasse: "B", verbrauchRange: [50, 75] },
  { klasse: "C", verbrauchRange: [75, 100] },
  { klasse: "D", verbrauchRange: [100, 130] },
  { klasse: "E", verbrauchRange: [130, 160] },
  { klasse: "F", verbrauchRange: [160, 200] },
  { klasse: "G", verbrauchRange: [200, 250] },
  { klasse: "H", verbrauchRange: [250, 350] },
];

const notizenPool = [
  "Erstbesichtigung durchgeführt, Interessent meldet sich nächste Woche.",
  "Verkäufer möchte vor Verkauf noch die Küche erneuern.",
  "Objekt wird derzeit noch bewohnt, Besichtigung nur nach Absprache.",
  "Dach wurde 2022 komplett erneuert, Rechnungen liegen vor.",
  "Gute Nachbarschaft, ruhige Wohnstraße mit wenig Durchgangsverkehr.",
  "Käufer hat Finanzierungszusage, Notartermin wird vereinbart.",
  "Grundbuch ist lastenfrei, keine Altlasten bekannt.",
  "Mieter hat Vorkaufsrecht, muss zuerst angefragt werden.",
  "Energetische Sanierung geplant, Fördermittel beantragt.",
  "Mehrere Interessenten vorhanden, Bieterverfahren möglich.",
  "Objekt steht seit 3 Monaten leer, sofort beziehbar.",
  "Teilfläche ist vermietet, Mieteinnahmen ca. 800 €/Monat.",
  "Eigentümer ist umzugsbedingt verhandlungsbereit.",
  "WEG-Protokolle der letzten 3 Jahre angefordert.",
  "Schornsteinfeger-Protokoll liegt vor, keine Beanstandungen.",
  "Garagenstellplatz separat zu erwerben (15.000 €).",
  "Besichtigung nur samstags möglich, Eigentümer arbeitet im Ausland.",
  "Kaufpreis wurde kürzlich reduziert, gutes Verhandlungspotenzial.",
  "Objekt wurde als Kapitalanlage genutzt, aktuelle Rendite 4,2%.",
  "Bodenrichtwert laut Gutachterausschuss: 320 €/m².",
  "",  // Some entries without notes
  "",
  "",
  "",
  "",
];

// --- Helpers ---

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

function formatPreisDE(preis: number): string {
  return preis.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeCSV(s: string): string {
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// --- Generator ---

const typen: Typ[] = ["wohnung", "wohnung", "wohnung", "haus", "haus", "grundstueck", "gewerbe"];
const statusOptionen = ["verfuegbar", "verfuegbar", "verfuegbar", "verfuegbar", "reserviert", "verkauft"];

const header = [
  "Straße", "Hausnr", "PLZ", "Ort", "Preis", "Wohnfläche", "Grundstücksfläche",
  "Zimmer", "Typ", "Baujahr", "Beschreibung", "Provision",
  "Energieausweis-Klasse", "Energieverbrauch",
  "Kontakt Name", "Kontakt Telefon", "Kontakt E-Mail",
  "Exposé-Nr", "Notizen", "Status",
].join(";");

const rows: string[] = [header];
const usedExpose = new Set<string>();
const usedStrassen = new Set<string>();

// Pre-generate a pool of 40 contacts (reused across properties)
const kontakte = Array.from({ length: 40 }, () => {
  const vorname = pick(vornamen);
  const nachname = pick(nachnamen);
  const [ort, , vorwahl] = pick(orteUndPlz);
  const tel = `${vorwahl} ${rand(10000000, 99999999)}`;
  const email = `${vorname.toLowerCase().replace(/ü/g, "ue").replace(/ö/g, "oe").replace(/ä/g, "ae")}.${nachname.toLowerCase().replace(/ü/g, "ue").replace(/ö/g, "oe").replace(/ä/g, "ae").replace(/ß/g, "ss")}@immobilien-${pick(["partner", "kontor", "agentur", "service", "zentrale", "profis"])}.de`;
  return { name: `${vorname} ${nachname}`, tel, email, ort };
});

for (let i = 1; i <= 500; i++) {
  const typ = pick(typen);
  const cfg = typConfigs[typ];
  const [ort, plzPrefix, _vorwahl] = pick(orteUndPlz);

  // Street
  let strasse: string;
  do {
    strasse = pick(strassenPrefixes) + pick(strassenSuffixes);
  } while (usedStrassen.has(`${strasse}-${ort}`) && usedStrassen.size < 500);
  usedStrassen.add(`${strasse}-${ort}`);

  const hausnr = `${rand(1, 120)}${Math.random() < 0.15 ? pick(["a", "b", "c"]) : ""}`;
  const plz = `${plzPrefix}${String(rand(100, 999)).padStart(3, "0")}`;

  // Prices
  const preis = roundTo(rand(cfg.preisRange[0], cfg.preisRange[1]), 5000);

  // Area
  const wohnflaeche = cfg.wohnflaecheRange[1] > 0 ? rand(cfg.wohnflaecheRange[0], cfg.wohnflaecheRange[1]) : 0;
  const grundstueck = cfg.grundstueckRange[1] > 0 ? roundTo(rand(cfg.grundstueckRange[0], cfg.grundstueckRange[1]), 10) : 0;

  // Rooms
  let zimmer = 0;
  if (cfg.zimmerRange[1] > 0) {
    zimmer = rand(cfg.zimmerRange[0] * 2, cfg.zimmerRange[1] * 2) / 2; // 0.5 steps
  }

  // Year
  const baujahr = cfg.baujahrRange[1] > 0 ? rand(cfg.baujahrRange[0], cfg.baujahrRange[1]) : 0;

  // Description
  let beschreibung = pick(cfg.beschreibungen);
  beschreibung = beschreibung.replace("$Z", String(zimmer % 1 === 0 ? zimmer : zimmer.toLocaleString("de-DE")));

  // Provision
  const provision = pick(provisionen);

  // Energy
  let energieKlasse = "";
  let energieVerbrauch = 0;
  if (typ !== "grundstueck") {
    const ek = pick(energieKlassen);
    energieKlasse = ek.klasse;
    energieVerbrauch = rand(ek.verbrauchRange[0], ek.verbrauchRange[1]);
  }

  // Contact (pick from pool, prefer contacts in same city)
  const sameCity = kontakte.filter((k) => k.ort === ort);
  const kontakt = sameCity.length > 0 && Math.random() < 0.6 ? pick(sameCity) : pick(kontakte);

  // Expose number
  let expose: string;
  do {
    expose = `IS-2024-${String(rand(1, 9999)).padStart(4, "0")}`;
  } while (usedExpose.has(expose));
  usedExpose.add(expose);

  // Status
  const status = pick(statusOptionen);

  // Notizen
  const notiz = pick(notizenPool);

  const row = [
    escapeCSV(strasse),
    hausnr,
    plz,
    ort,
    formatPreisDE(preis),
    wohnflaeche || 0,
    grundstueck || 0,
    zimmer ? zimmer.toLocaleString("de-DE") : "0",
    typ,
    baujahr || 0,
    escapeCSV(beschreibung),
    escapeCSV(provision),
    energieKlasse,
    energieVerbrauch || 0,
    escapeCSV(kontakt.name),
    kontakt.tel,
    kontakt.email,
    expose,
    escapeCSV(notiz),
    status,
  ].join(";");

  rows.push(row);
}

const csv = rows.join("\n") + "\n";
const outPath = `${import.meta.dir}/beispiel-immobilien.csv`;
await Bun.write(outPath, csv);
console.log(`Generated ${rows.length - 1} records → ${outPath}`);
