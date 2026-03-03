import { useState, useEffect } from "react";
import type { ImmobilienFilter } from "@immoshark/shared";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { RangeSlider } from "../ui/RangeSlider";

interface FilterBarProps {
  filter: ImmobilienFilter;
  onChange: (filter: ImmobilienFilter) => void;
}

const formatPreis = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)} Mio €`
    : `${(v / 1_000).toFixed(0)}T €`;

export function FilterBar({ filter, onChange }: FilterBarProps) {
  // Local draft state — only propagated on "Suchen" click or Enter
  const [draft, setDraft] = useState<ImmobilienFilter>(filter);

  // Sync draft when parent filter changes externally (e.g. pagination, sort, reset)
  useEffect(() => {
    setDraft(filter);
  }, [filter]);

  const set = (partial: Partial<ImmobilienFilter>) =>
    setDraft((prev) => ({ ...prev, ...partial }));

  function apply() {
    onChange({ ...draft, seite: 1 });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      apply();
    }
  }

  function reset() {
    const empty: ImmobilienFilter = { seite: 1, limit: 20 };
    setDraft(empty);
    onChange(empty);
  }

  const isGrouped = draft.gruppe === "kontakt";

  return (
    <div
      className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      onKeyDown={handleKeyDown}
    >
      {/* Row 1: Text search + dropdowns */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Suche (alle Felder)..."
          value={draft.suche || ""}
          onChange={(e) => set({ suche: e.target.value })}
        />
        <Select
          placeholder="Alle Typen"
          value={draft.typ || ""}
          onChange={(e) => set({ typ: (e.target.value || undefined) as any })}
          options={[
            { value: "wohnung", label: "Wohnung" },
            { value: "haus", label: "Haus" },
            { value: "grundstueck", label: "Grundstück" },
            { value: "gewerbe", label: "Gewerbe" },
          ]}
        />
        <Select
          placeholder="Alle Status"
          value={draft.status || ""}
          onChange={(e) => set({ status: (e.target.value || undefined) as any })}
          options={[
            { value: "verfuegbar", label: "Verfügbar" },
            { value: "reserviert", label: "Reserviert" },
            { value: "verkauft", label: "Verkauft" },
          ]}
        />
        <Input
          placeholder="Ort..."
          value={draft.ort || ""}
          onChange={(e) => set({ ort: e.target.value || undefined })}
        />
      </div>

      {/* Row 2: Preis sliders + Fläche inputs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RangeSlider
          label="Preis min"
          value={draft.preis_min}
          onChange={(v) => set({ preis_min: v })}
          min={0}
          max={2_000_000}
          step={10_000}
          formatValue={formatPreis}
        />
        <RangeSlider
          label="Preis max"
          value={draft.preis_max}
          onChange={(v) => set({ preis_max: v })}
          min={0}
          max={5_000_000}
          step={10_000}
          formatValue={formatPreis}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Fläche min"
            type="number"
            value={draft.flaeche_min ?? ""}
            onChange={(e) => set({ flaeche_min: e.target.value ? Number(e.target.value) : undefined })}
          />
          <Input
            placeholder="Fläche max"
            type="number"
            value={draft.flaeche_max ?? ""}
            onChange={(e) => set({ flaeche_max: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </div>

      {/* Row 3: Zimmer sliders */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RangeSlider
          label="Zimmer min"
          value={draft.zimmer_min}
          onChange={(v) => set({ zimmer_min: v })}
          min={1}
          max={10}
          step={0.5}
        />
        <RangeSlider
          label="Zimmer max"
          value={draft.zimmer_max}
          onChange={(v) => set({ zimmer_max: v })}
          min={1}
          max={15}
          step={0.5}
        />
      </div>

      {/* Row 4: Actions */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => {
            const next = { ...draft, gruppe: isGrouped ? undefined : ("kontakt" as const) };
            setDraft(next);
            onChange({ ...next, seite: 1 });
          }}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            isGrouped
              ? "bg-shark text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
          </svg>
          Nach Kontakt gruppieren
        </button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={reset}>
            Zurücksetzen
          </Button>
          <Button size="sm" onClick={apply}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            Suchen
          </Button>
        </div>
      </div>
    </div>
  );
}
