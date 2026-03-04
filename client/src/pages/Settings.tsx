import { useState } from "react";
import { getSetting, setSetting } from "../lib/settings";

export function Settings() {
  const [aiEnabled, setAiEnabled] = useState(() => getSetting("ai_mapping_enabled", true));

  function handleToggle() {
    const next = !aiEnabled;
    setAiEnabled(next);
    setSetting("ai_mapping_enabled", next);
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
    </div>
  );
}
