export const ImmobilienTyp = {
  WOHNUNG: "wohnung",
  HAUS: "haus",
  GRUNDSTUECK: "grundstueck",
  GEWERBE: "gewerbe",
} as const;
export type ImmobilienTyp = (typeof ImmobilienTyp)[keyof typeof ImmobilienTyp];

export const ImmobilienStatus = {
  VERFUEGBAR: "verfuegbar",
  RESERVIERT: "reserviert",
  VERKAUFT: "verkauft",
} as const;
export type ImmobilienStatus =
  (typeof ImmobilienStatus)[keyof typeof ImmobilienStatus];

export const EnergieausweisKlasse = {
  "A+": "A+",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  E: "E",
  F: "F",
  G: "G",
  H: "H",
} as const;
export type EnergieausweisKlasse =
  (typeof EnergieausweisKlasse)[keyof typeof EnergieausweisKlasse];

export interface Immobilie {
  id: number;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  preis: number | null;
  wohnflaeche: number | null;
  grundstuecksflaeche: number | null;
  zimmeranzahl: number | null;
  typ: ImmobilienTyp;
  baujahr: number | null;
  beschreibung: string | null;
  provision: string | null;
  energieausweis_klasse: EnergieausweisKlasse | null;
  energieausweis_verbrauch: number | null;
  kontakt_name: string | null;
  kontakt_telefon: string | null;
  kontakt_email: string | null;
  expose_nummer: string | null;
  notizen: string | null;
  veroeffentlicht: string | null;
  status: ImmobilienStatus;
  erstellt_am: string;
  aktualisiert_am: string;
  bilder?: ImmobilieBild[];
}

export interface ImmobilieBild {
  id: number;
  immobilie_id: number;
  url: string;
  beschreibung: string | null;
  reihenfolge: number;
}

export interface ImmobilieCreateDTO {
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  preis?: number | null;
  wohnflaeche?: number | null;
  grundstuecksflaeche?: number | null;
  zimmeranzahl?: number | null;
  typ: ImmobilienTyp;
  baujahr?: number | null;
  beschreibung?: string | null;
  provision?: string | null;
  energieausweis_klasse?: EnergieausweisKlasse | null;
  energieausweis_verbrauch?: number | null;
  kontakt_name?: string | null;
  kontakt_telefon?: string | null;
  kontakt_email?: string | null;
  expose_nummer?: string | null;
  notizen?: string | null;
  veroeffentlicht?: string | null;
  status?: ImmobilienStatus;
}

export type ImmobilieUpdateDTO = Partial<ImmobilieCreateDTO>;

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    seite: number;
    limit: number;
    gesamt: number;
  };
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    message: string;
    code: string;
  };
}

export type SortColumn =
  | "strasse"
  | "typ"
  | "ort"
  | "preis"
  | "wohnflaeche"
  | "zimmeranzahl"
  | "status"
  | "baujahr"
  | "grundstuecksflaeche"
  | "kontakt_name"
  | "erstellt_am"
  | "aktualisiert_am";

export type SortOrder = "asc" | "desc";

export interface ImmobilienFilter {
  suche?: string;
  typ?: ImmobilienTyp;
  status?: ImmobilienStatus;
  ort?: string;
  preis_min?: number;
  preis_max?: number;
  flaeche_min?: number;
  flaeche_max?: number;
  zimmer_min?: number;
  zimmer_max?: number;
  erstellt_von?: string;
  erstellt_bis?: string;
  sort_by?: SortColumn;
  sort_order?: SortOrder;
  gruppe?: "kontakt";
  seite?: number;
  limit?: number;
}

export interface DashboardStats {
  gesamt: number;
  verfuegbar: number;
  reserviert: number;
  verkauft: number;
  durchschnittspreis: number | null;
  nach_typ: Record<string, number>;
}

export interface CsvUploadResult {
  headers: string[];
  preview: string[][];
  total_rows: number;
}

export interface CsvColumnMapping {
  [csvHeader: string]: keyof ImmobilieCreateDTO | null;
}

export interface CsvImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}
