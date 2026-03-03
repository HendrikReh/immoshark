import { z } from "zod";

export const immobilienTypSchema = z.enum([
  "wohnung",
  "haus",
  "grundstueck",
  "gewerbe",
]);

export const immobilienStatusSchema = z.enum([
  "verfuegbar",
  "reserviert",
  "verkauft",
]);

export const energieausweisKlasseSchema = z.enum([
  "A+",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
]);

export const immobilieCreateSchema = z.object({
  strasse: z.string().min(1, "Straße ist erforderlich"),
  hausnummer: z.string().min(1, "Hausnummer ist erforderlich"),
  plz: z.string().regex(/^\d{5}$/, "PLZ muss 5 Ziffern haben"),
  ort: z.string().min(1, "Ort ist erforderlich"),
  preis: z.number().positive("Preis muss positiv sein").nullable().optional(),
  wohnflaeche: z
    .number()
    .positive("Wohnfläche muss positiv sein")
    .nullable()
    .optional(),
  grundstuecksflaeche: z
    .number()
    .positive("Grundstücksfläche muss positiv sein")
    .nullable()
    .optional(),
  zimmeranzahl: z
    .number()
    .positive("Zimmeranzahl muss positiv sein")
    .nullable()
    .optional(),
  typ: immobilienTypSchema,
  baujahr: z
    .number()
    .int()
    .min(1800, "Baujahr zu alt")
    .max(new Date().getFullYear() + 5, "Baujahr in der Zukunft")
    .nullable()
    .optional(),
  beschreibung: z.string().nullable().optional(),
  provision: z.string().nullable().optional(),
  energieausweis_klasse: energieausweisKlasseSchema.nullable().optional(),
  energieausweis_verbrauch: z
    .number()
    .nonnegative("Verbrauch kann nicht negativ sein")
    .nullable()
    .optional(),
  kontakt_name: z.string().nullable().optional(),
  kontakt_telefon: z.string().nullable().optional(),
  kontakt_email: z.string().email("Ungültige E-Mail").nullable().optional(),
  expose_nummer: z.string().nullable().optional(),
  notizen: z.string().max(500, "Notizen dürfen maximal 500 Zeichen haben").nullable().optional(),
  veroeffentlicht: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum im Format JJJJ-MM-TT").nullable().optional(),
  status: immobilienStatusSchema.optional().default("verfuegbar"),
});

export const immobilieUpdateSchema = immobilieCreateSchema.partial();

export const immobilienFilterSchema = z.object({
  suche: z.string().optional(),
  typ: immobilienTypSchema.optional(),
  status: immobilienStatusSchema.optional(),
  ort: z.string().optional(),
  preis_min: z.coerce.number().optional(),
  preis_max: z.coerce.number().optional(),
  flaeche_min: z.coerce.number().optional(),
  flaeche_max: z.coerce.number().optional(),
  zimmer_min: z.coerce.number().optional(),
  zimmer_max: z.coerce.number().optional(),
  erstellt_von: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  erstellt_bis: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sort_by: z.enum([
    "strasse", "typ", "ort", "preis", "wohnflaeche", "zimmeranzahl",
    "status", "baujahr", "grundstuecksflaeche", "kontakt_name",
    "erstellt_am", "aktualisiert_am",
  ]).optional(),
  sort_order: z.enum(["asc", "desc"]).optional().default("asc"),
  gruppe: z.enum(["kontakt"]).optional(),
  seite: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const csvColumnMappingSchema = z.record(
  z.string(),
  z
    .enum([
      "strasse",
      "hausnummer",
      "plz",
      "ort",
      "preis",
      "wohnflaeche",
      "grundstuecksflaeche",
      "zimmeranzahl",
      "typ",
      "baujahr",
      "beschreibung",
      "provision",
      "energieausweis_klasse",
      "energieausweis_verbrauch",
      "kontakt_name",
      "kontakt_telefon",
      "kontakt_email",
      "expose_nummer",
      "notizen",
      "veroeffentlicht",
      "status",
    ])
    .nullable()
);
