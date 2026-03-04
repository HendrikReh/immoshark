import { useState } from "react";
import type { CsvImportProfile } from "@immoshark/shared";
import { getSetting, setSetting, getProfiles, saveProfile, deleteProfile } from "../lib/settings";
import { useToast } from "../components/ui/Toast";

export function Settings() {
  const [aiEnabled, setAiEnabled] = useState(() => getSetting("ai_mapping_enabled", true));
  const [profiles, setProfiles] = useState(() => getProfiles());
  const { toast } = useToast();

  function handleToggle() {
    const next = !aiEnabled;
    setAiEnabled(next);
    setSetting("ai_mapping_enabled", next);
  }

  function handleSetDefault(profile: CsvImportProfile) {
    const updated = { ...profile, isDefault: !profile.isDefault, updatedAt: new Date().toISOString() };
    saveProfile(updated);
    setProfiles(getProfiles());
    toast(updated.isDefault ? `"${profile.name}" als Standard gesetzt` : `Standard entfernt`, "success");
  }

  function handleDelete(profile: CsvImportProfile) {
    if (!confirm(`Profil "${profile.name}" wirklich löschen?`)) return;
    deleteProfile(profile.id);
    setProfiles(getProfiles());
    toast(`Profil "${profile.name}" gelöscht`, "success");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              KI-gestützte Spalten-Zuordnung
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Verwendet GPT, um CSV-Spalten beim Import automatisch den
              Datenbankfeldern zuzuordnen. Kann im Import-Schritt pro Datei
              überschrieben werden.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={aiEnabled}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              aiEnabled ? "bg-shark" : "bg-gray-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                aiEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Import Profiles */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Import-Profile</h2>
        {profiles.length === 0 ? (
          <p className="text-sm text-gray-500">
            Keine Profile vorhanden. Profile können beim CSV-Import im Zuordnungs-Schritt erstellt werden.
          </p>
        ) : (
          <div className="divide-y divide-gray-200">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{p.name}</span>
                    {p.isDefault && (
                      <span className="rounded-full bg-shark/10 px-2 py-0.5 text-xs font-medium text-shark">
                        Standard
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Erstellt: {new Date(p.createdAt).toLocaleDateString("de-DE")}
                    {" · "}
                    {Object.values(p.mapping).filter(Boolean).length} Spalten-Zuordnungen
                    {" · "}
                    KI: {p.aiEnabled ? "an" : "aus"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSetDefault(p)}
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                      p.isDefault
                        ? "bg-shark/10 text-shark"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    }`}
                  >
                    {p.isDefault ? "Standard" : "Als Standard"}
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
