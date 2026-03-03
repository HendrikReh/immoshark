import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import type { ImmobilieCreateDTO } from "@immoshark/shared";
import { api } from "../api/client";
import { useImmobilie } from "../hooks/useImmobilien";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";

const emptyForm: ImmobilieCreateDTO = {
  strasse: "",
  hausnummer: "",
  plz: "",
  ort: "",
  typ: "wohnung",
  status: "verfuegbar",
};

export function ImmobilieForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { data: existing } = useImmobilie(isEdit ? parseInt(id) : null);
  const [form, setForm] = useState<ImmobilieCreateDTO>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      const { id: _id, erstellt_am: _e, aktualisiert_am: _a, bilder: _b, ...rest } = existing;
      setForm(rest as ImmobilieCreateDTO);
    }
  }, [existing]);

  const set = (field: keyof ImmobilieCreateDTO, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setNum = (field: keyof ImmobilieCreateDTO, raw: string) =>
    set(field, raw === "" ? null : Number(raw));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await api.update(parseInt(id), form);
        navigate(`/immobilien/${id}`);
      } else {
        const res = await api.create(form);
        navigate(`/immobilien/${res.data.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to={isEdit ? `/immobilien/${id}` : "/immobilien"} className="text-sm text-gray-500 hover:text-gray-700">
          ← Zurück
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          {isEdit ? "Immobilie bearbeiten" : "Neue Immobilie"}
        </h1>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-gray-900">Adresse</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Input label="Straße" required value={form.strasse} onChange={(e) => set("strasse", e.target.value)} />
            </div>
            <Input label="Hausnummer" required value={form.hausnummer} onChange={(e) => set("hausnummer", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="PLZ" required value={form.plz} onChange={(e) => set("plz", e.target.value)} />
            <div className="sm:col-span-2">
              <Input label="Ort" required value={form.ort} onChange={(e) => set("ort", e.target.value)} />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-gray-900">Objektdaten</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Typ"
              value={form.typ}
              onChange={(e) => set("typ", e.target.value)}
              options={[
                { value: "wohnung", label: "Wohnung" },
                { value: "haus", label: "Haus" },
                { value: "grundstueck", label: "Grundstück" },
                { value: "gewerbe", label: "Gewerbe" },
              ]}
            />
            <Select
              label="Status"
              value={form.status || "verfuegbar"}
              onChange={(e) => set("status", e.target.value)}
              options={[
                { value: "verfuegbar", label: "Verfügbar" },
                { value: "reserviert", label: "Reserviert" },
                { value: "verkauft", label: "Verkauft" },
              ]}
            />
            <Input label="Preis (€)" type="number" value={form.preis ?? ""} onChange={(e) => setNum("preis", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Input label="Wohnfläche (m²)" type="number" value={form.wohnflaeche ?? ""} onChange={(e) => setNum("wohnflaeche", e.target.value)} />
            <Input label="Grundstücksfläche (m²)" type="number" value={form.grundstuecksflaeche ?? ""} onChange={(e) => setNum("grundstuecksflaeche", e.target.value)} />
            <Input label="Zimmeranzahl" type="number" step="0.5" value={form.zimmeranzahl ?? ""} onChange={(e) => setNum("zimmeranzahl", e.target.value)} />
            <Input label="Baujahr" type="number" value={form.baujahr ?? ""} onChange={(e) => setNum("baujahr", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
            <textarea
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-shark focus:outline-none focus:ring-1 focus:ring-shark"
              rows={4}
              value={form.beschreibung ?? ""}
              onChange={(e) => set("beschreibung", e.target.value || null)}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-gray-900">Weitere Angaben</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Provision" value={form.provision ?? ""} onChange={(e) => set("provision", e.target.value || null)} />
            <Select
              label="Energieausweis-Klasse"
              value={form.energieausweis_klasse ?? ""}
              onChange={(e) => set("energieausweis_klasse", e.target.value || null)}
              placeholder="Nicht angegeben"
              options={["A+", "A", "B", "C", "D", "E", "F", "G", "H"].map((k) => ({
                value: k,
                label: k,
              }))}
            />
            <Input label="Energieverbrauch (kWh/m²a)" type="number" value={form.energieausweis_verbrauch ?? ""} onChange={(e) => setNum("energieausweis_verbrauch", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Exposé-Nummer" value={form.expose_nummer ?? ""} onChange={(e) => set("expose_nummer", e.target.value || null)} />
            <div>
              <label className="block text-sm font-medium text-gray-700">Veröffentlicht am</label>
              <input
                type="date"
                value={form.veroeffentlicht ?? ""}
                onChange={(e) => set("veroeffentlicht", e.target.value || null)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-shark focus:outline-none focus:ring-1 focus:ring-shark"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-gray-900">Notizen</legend>
          <div>
            <textarea
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-shark focus:outline-none focus:ring-1 focus:ring-shark"
              rows={3}
              maxLength={500}
              placeholder="Interne Notizen zum Objekt (max. 500 Zeichen)..."
              value={form.notizen ?? ""}
              onChange={(e) => set("notizen", e.target.value || null)}
            />
            <p className="mt-1 text-xs text-gray-400 text-right">
              {(form.notizen ?? "").length}/500
            </p>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-gray-900">Kontakt</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Name" value={form.kontakt_name ?? ""} onChange={(e) => set("kontakt_name", e.target.value || null)} />
            <Input label="Telefon" value={form.kontakt_telefon ?? ""} onChange={(e) => set("kontakt_telefon", e.target.value || null)} />
            <Input label="E-Mail" type="email" value={form.kontakt_email ?? ""} onChange={(e) => set("kontakt_email", e.target.value || null)} />
          </div>
        </fieldset>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Link to={isEdit ? `/immobilien/${id}` : "/immobilien"}>
            <Button type="button" variant="secondary">
              Abbrechen
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? "Speichern..." : isEdit ? "Speichern" : "Anlegen"}
          </Button>
        </div>
      </form>
    </div>
  );
}
