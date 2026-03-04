import { useState, useRef } from "react";
import type { CsvColumnMapping, CsvUploadResult, CsvImportResult, CsvImportProfile, ImmobilieCreateDTO } from "@immoshark/shared";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/Toast";
import { getSetting, setSetting, getProfiles, getDefaultProfile, saveProfile } from "../lib/settings";

type Step = "upload" | "mapping" | "preview" | "result";

const FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: "strasse", label: "Straße" },
  { value: "hausnummer", label: "Hausnummer" },
  { value: "plz", label: "PLZ" },
  { value: "ort", label: "Ort" },
  { value: "preis", label: "Preis" },
  { value: "wohnflaeche", label: "Wohnfläche" },
  { value: "grundstuecksflaeche", label: "Grundstücksfläche" },
  { value: "zimmeranzahl", label: "Zimmeranzahl" },
  { value: "typ", label: "Typ" },
  { value: "baujahr", label: "Baujahr" },
  { value: "beschreibung", label: "Beschreibung" },
  { value: "provision", label: "Provision" },
  { value: "energieausweis_klasse", label: "Energieausweis-Klasse" },
  { value: "energieausweis_verbrauch", label: "Energieverbrauch" },
  { value: "kontakt_name", label: "Kontakt Name" },
  { value: "kontakt_telefon", label: "Kontakt Telefon" },
  { value: "kontakt_email", label: "Kontakt E-Mail" },
  { value: "expose_nummer", label: "Exposé-Nummer" },
  { value: "notizen", label: "Notizen" },
  { value: "veroeffentlicht", label: "Veröffentlicht am" },
  { value: "status", label: "Status" },
  { value: "__freitext__", label: "Freitext-Extraktion (KI)" },
];

// Auto-map CSV headers to DB fields
function autoMap(headers: string[]): CsvColumnMapping {
  const mapping: CsvColumnMapping = {};
  const hints: Record<string, keyof ImmobilieCreateDTO> = {
    straße: "strasse", strasse: "strasse", street: "strasse",
    hausnr: "hausnummer", hausnummer: "hausnummer",
    plz: "plz", postleitzahl: "plz",
    ort: "ort", stadt: "ort", city: "ort",
    preis: "preis", kaufpreis: "preis", price: "preis",
    wohnfläche: "wohnflaeche", wohnflaeche: "wohnflaeche", fläche: "wohnflaeche",
    grundstücksfläche: "grundstuecksflaeche", grundstuecksflaeche: "grundstuecksflaeche",
    zimmer: "zimmeranzahl", zimmeranzahl: "zimmeranzahl", räume: "zimmeranzahl",
    typ: "typ", type: "typ", objektart: "typ",
    baujahr: "baujahr",
    beschreibung: "beschreibung", description: "beschreibung",
    provision: "provision",
    energieausweis: "energieausweis_klasse", energieklasse: "energieausweis_klasse",
    verbrauch: "energieausweis_verbrauch",
    kontakt: "kontakt_name", name: "kontakt_name",
    telefon: "kontakt_telefon", phone: "kontakt_telefon",
    email: "kontakt_email", "e-mail": "kontakt_email",
    "exposé-nr": "expose_nummer", expose: "expose_nummer", "exposé": "expose_nummer",
    notizen: "notizen", anmerkungen: "notizen", bemerkungen: "notizen",
    veröffentlicht: "veroeffentlicht", veroeffentlicht: "veroeffentlicht", "veröffentlicht am": "veroeffentlicht",
    "online seit": "veroeffentlicht", "inseriert am": "veroeffentlicht",
    status: "status",
  };

  for (const header of headers) {
    const normalized = header.toLowerCase().replace(/[_\-\s]+/g, "").trim();
    for (const [hint, field] of Object.entries(hints)) {
      if (normalized === hint.replace(/[_\-\s]+/g, "") || normalized.includes(hint.replace(/[_\-\s]+/g, ""))) {
        mapping[header] = field;
        break;
      }
    }
    if (!mapping[header]) mapping[header] = null;
  }
  return mapping;
}

export function CsvImport() {
  const [step, setStep] = useState<Step>("upload");
  const [sessionId, setSessionId] = useState<string>("");
  const [uploadResult, setUploadResult] = useState<CsvUploadResult | null>(null);
  const [mapping, setMapping] = useState<CsvColumnMapping>({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(() => getSetting("ai_mapping_enabled", true));
  const [aiLoading, setAiLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Profile state
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveMode, setSaveMode] = useState<"new" | "overwrite">("new");
  const [newProfileName, setNewProfileName] = useState("");
  const [overwriteProfileId, setOverwriteProfileId] = useState<string>("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  function applyProfile(profile: CsvImportProfile, headers: string[]) {
    const applied: CsvColumnMapping = {};
    for (const h of headers) {
      applied[h] = h in profile.mapping ? profile.mapping[h] : null;
    }
    setMapping(applied);
    setAiEnabled(profile.aiEnabled);
    setSetting("ai_mapping_enabled", profile.aiEnabled);
    setSelectedProfileId(profile.id);
  }

  function handleProfileSelect(profileId: string) {
    if (!profileId || !uploadResult) {
      setSelectedProfileId(null);
      return;
    }
    const profile = getProfiles().find((p) => p.id === profileId);
    if (profile) applyProfile(profile, uploadResult.headers);
  }

  function handleSaveProfile() {
    const profiles = getProfiles();
    const now = new Date().toISOString();

    if (saveMode === "new") {
      if (!newProfileName.trim()) return;
      const profile: CsvImportProfile = {
        id: crypto.randomUUID(),
        name: newProfileName.trim(),
        mapping: { ...mapping },
        aiEnabled,
        isDefault: saveAsDefault,
        createdAt: now,
        updatedAt: now,
      };
      saveProfile(profile);
      setSelectedProfileId(profile.id);
      toast(`Profil "${profile.name}" gespeichert`, "success");
    } else {
      const existing = profiles.find((p) => p.id === overwriteProfileId);
      if (!existing) return;
      const updated: CsvImportProfile = {
        ...existing,
        mapping: { ...mapping },
        aiEnabled,
        isDefault: saveAsDefault,
        updatedAt: now,
      };
      saveProfile(updated);
      setSelectedProfileId(updated.id);
      toast(`Profil "${updated.name}" aktualisiert`, "success");
    }

    setSaveModalOpen(false);
    setNewProfileName("");
    setSaveAsDefault(false);
  }

  async function handleFile(file: File) {
    setError(null);
    try {
      const res = await api.uploadCsv(file);
      setUploadResult(res.data);
      setSessionId(res.data.session_id);

      // Apply default profile if available, otherwise autoMap
      const defaultProfile = getDefaultProfile();
      if (defaultProfile) {
        applyProfile(defaultProfile, res.data.headers);
      } else {
        setMapping(autoMap(res.data.headers));
        setSelectedProfileId(null);
      }
      setStep("mapping");

      // Fire AI mapping in background if enabled (and no default profile was applied)
      if (!defaultProfile && aiEnabled) {
        setAiLoading(true);
        api.suggestMapping(res.data.session_id)
          .then((aiRes) => {
            setMapping(aiRes.data.mapping);
          })
          .catch(() => {
            // Silently keep dictionary mapping on AI failure
          })
          .finally(() => setAiLoading(false));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    }
  }

  function handleAiToggle() {
    const next = !aiEnabled;
    setAiEnabled(next);
    setSetting("ai_mapping_enabled", next);

    // If toggling on and we have a session, trigger AI mapping
    if (next && sessionId && !aiLoading) {
      setAiLoading(true);
      api.suggestMapping(sessionId)
        .then((aiRes) => {
          setMapping(aiRes.data.mapping);
        })
        .catch(() => {})
        .finally(() => setAiLoading(false));
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    setImporting(true);
    setError(null);
    try {
      const res = await api.importCsv(sessionId, mapping);
      setImportResult(res.data);
      setStep("result");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Import fehlgeschlagen");
    } finally {
      setImporting(false);
    }
  }

  const steps = [
    { key: "upload", label: "1. Hochladen" },
    { key: "mapping", label: "2. Zuordnung" },
    { key: "preview", label: "3. Vorschau" },
    { key: "result", label: "4. Ergebnis" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">CSV Import</h1>

      {/* Step indicator */}
      <div className="flex gap-2">
        {steps.map((s) => (
          <div
            key={s.key}
            className={`flex-1 rounded-lg py-2 text-center text-sm font-medium ${
              step === s.key
                ? "bg-shark text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center gap-4 rounded-xl border-2 border-dashed p-12 transition-colors ${
            dragOver ? "border-shark bg-shark/5" : "border-gray-300 bg-white"
          }`}
        >
          <div className="text-4xl">📄</div>
          <p className="text-gray-600">
            CSV-Datei hierher ziehen oder{" "}
            <button
              className="font-medium text-shark underline"
              onClick={() => fileRef.current?.click()}
            >
              auswählen
            </button>
          </p>
          <p className="text-xs text-gray-400">
            Unterstützt: CSV mit Semikolon (;) oder Komma (,) als Trennzeichen
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === "mapping" && uploadResult && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Profile bar */}
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <label className="shrink-0 text-sm font-medium text-gray-700">Profil:</label>
            <select
              value={selectedProfileId || ""}
              onChange={(e) => handleProfileSelect(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-shark focus:outline-none focus:ring-1 focus:ring-shark"
            >
              <option value="">Kein Profil</option>
              {getProfiles().map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.isDefault ? " (Standard)" : ""}
                </option>
              ))}
            </select>
            <Button variant="secondary" onClick={() => {
              setSaveMode("new");
              setNewProfileName("");
              setOverwriteProfileId(getProfiles()[0]?.id || "");
              setSaveAsDefault(false);
              setSaveModalOpen(true);
            }}>
              Speichern
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {uploadResult.total_rows} Zeilen erkannt. Ordnen Sie die CSV-Spalten den Datenbankfeldern zu:
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">KI-Zuordnung</span>
              <button
                type="button"
                role="switch"
                aria-checked={aiEnabled}
                onClick={handleAiToggle}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  aiEnabled ? "bg-shark" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    aiEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </label>
          </div>
          {aiLoading && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              KI analysiert Spalten...
            </div>
          )}
          <div className="space-y-3">
            {uploadResult.headers.map((header) => (
              <div key={header} className="flex items-center gap-4">
                <span className="w-48 truncate text-sm font-medium text-gray-700">{header}</span>
                <span className="text-gray-400">→</span>
                <Select
                  value={mapping[header] || ""}
                  onChange={(e) =>
                    setMapping({ ...mapping, [header]: (e.target.value || null) as any })
                  }
                  placeholder="— Nicht importieren —"
                  options={FIELD_OPTIONS}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
            <Button variant="secondary" onClick={() => setStep("upload")}>
              Zurück
            </Button>
            <Button onClick={() => setStep("preview")}>Weiter zur Vorschau</Button>
          </div>
        </div>
      )}

      {/* Save Profile Modal */}
      <Modal open={saveModalOpen} onClose={() => setSaveModalOpen(false)} title="Profil speichern">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="saveMode"
                checked={saveMode === "new"}
                onChange={() => setSaveMode("new")}
                className="text-shark focus:ring-shark"
              />
              <span className="text-sm font-medium">Neues Profil anlegen</span>
            </label>
            {saveMode === "new" && (
              <div className="ml-6">
                <Input
                  placeholder="z.B. Saarland-Format"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  autoFocus
                />
              </div>
            )}
          </div>

          {getProfiles().length > 0 && (
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="saveMode"
                  checked={saveMode === "overwrite"}
                  onChange={() => {
                    setSaveMode("overwrite");
                    if (!overwriteProfileId) setOverwriteProfileId(getProfiles()[0]?.id || "");
                  }}
                  className="text-shark focus:ring-shark"
                />
                <span className="text-sm font-medium">Bestehendes überschreiben</span>
              </label>
              {saveMode === "overwrite" && (
                <div className="ml-6">
                  <select
                    value={overwriteProfileId}
                    onChange={(e) => setOverwriteProfileId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-shark focus:outline-none focus:ring-1 focus:ring-shark"
                  >
                    {getProfiles().map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 border-t border-gray-200 pt-3">
            <input
              type="checkbox"
              checked={saveAsDefault}
              onChange={(e) => setSaveAsDefault(e.target.checked)}
              className="rounded text-shark focus:ring-shark"
            />
            <span className="text-sm text-gray-700">Als Standard-Profil setzen</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setSaveModalOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={saveMode === "new" && !newProfileName.trim()}
            >
              Speichern
            </Button>
          </div>
        </div>
      </Modal>

      {/* Step 3: Preview */}
      {step === "preview" && uploadResult && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">
            Vorschau der ersten {uploadResult.preview.length} Zeilen:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {uploadResult.headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      {h}
                      {mapping[h] && (
                        <span className="ml-1 text-shark">→ {mapping[h]}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {uploadResult.preview.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-gray-600">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
            <Button variant="secondary" onClick={() => setStep("mapping")}>
              Zurück
            </Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importiere..." : `${uploadResult.total_rows} Zeilen importieren`}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === "result" && importResult && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-center">
            <div className="text-4xl">
              {importResult.errors.length === 0 ? "✅" : "⚠️"}
            </div>
            <h2 className="mt-2 text-lg font-semibold">Import abgeschlossen</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-2xl font-bold text-green-700">{importResult.imported}</p>
              <p className="text-sm text-green-600">Importiert</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-2xl font-bold text-gray-700">{importResult.skipped}</p>
              <p className="text-sm text-gray-600">Übersprungen</p>
            </div>
          </div>
          {importResult.errors.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-lg bg-red-50 p-3">
              {importResult.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-700">{err}</p>
              ))}
            </div>
          )}
          <div className="flex justify-center gap-2 border-t border-gray-200 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setStep("upload");
                setUploadResult(null);
                setImportResult(null);
              }}
            >
              Weitere Datei importieren
            </Button>
            <Button onClick={() => window.location.assign("/immobilien")}>
              Zur Übersicht
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
