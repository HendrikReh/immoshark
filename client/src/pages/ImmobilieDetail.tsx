import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useImmobilie } from "../hooks/useImmobilien";
import { api } from "../api/client";
import { formatPreis, formatFlaeche, typLabel } from "../lib/utils";
import { StatusBadge } from "../components/immobilien/StatusBadge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";

export function ImmobilieDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: immo, loading, error } = useImmobilie(id ? parseInt(id) : null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading) return <div className="py-12 text-center text-gray-500">Laden...</div>;
  if (error) return <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>;
  if (!immo) return <div className="py-12 text-center text-gray-500">Nicht gefunden.</div>;

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(immo!.id);
      navigate("/immobilien");
    } catch {
      setDeleting(false);
    }
  }

  const details = [
    { label: "Adresse", value: `${immo.strasse} ${immo.hausnummer}, ${immo.plz} ${immo.ort}` },
    { label: "Typ", value: typLabel(immo.typ) },
    { label: "Preis", value: formatPreis(immo.preis) },
    { label: "Wohnfläche", value: formatFlaeche(immo.wohnflaeche) },
    { label: "Grundstücksfläche", value: formatFlaeche(immo.grundstuecksflaeche) },
    { label: "Zimmer", value: immo.zimmeranzahl?.toString() || "—" },
    { label: "Baujahr", value: immo.baujahr?.toString() || "—" },
    { label: "Provision", value: immo.provision || "—" },
    { label: "Energieausweis", value: immo.energieausweis_klasse ? `${immo.energieausweis_klasse} (${immo.energieausweis_verbrauch || "—"} kWh/m²a)` : "—" },
    { label: "Exposé-Nr.", value: immo.expose_nummer || "—" },
    { label: "Veröffentlicht am", value: immo.veroeffentlicht ? new Date(immo.veroeffentlicht).toLocaleDateString("de-DE") : "—" },
    { label: "Kontakt", value: [immo.kontakt_name, immo.kontakt_telefon, immo.kontakt_email].filter(Boolean).join(" · ") || "—" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/immobilien" className="text-sm text-gray-500 hover:text-gray-700">
            ← Zurück zur Liste
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            {immo.strasse} {immo.hausnummer}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link to={`/immobilien/${immo.id}/bearbeiten`}>
            <Button variant="secondary">Bearbeiten</Button>
          </Link>
          <Button variant="danger" onClick={() => setDeleteModal(true)}>
            Löschen
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <StatusBadge status={immo.status} />
          <span className="text-lg font-semibold text-shark">{formatPreis(immo.preis)}</span>
        </div>

        {immo.beschreibung && (
          <p className="mb-6 text-gray-600">{immo.beschreibung}</p>
        )}

        {immo.notizen && (
          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-amber-600 mb-1">Notizen</p>
            <p className="text-sm text-amber-900 whitespace-pre-line">{immo.notizen}</p>
          </div>
        )}

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {details.map((d) => (
            <div key={d.label}>
              <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {d.label}
              </dt>
              <dd className="mt-0.5 text-sm text-gray-900">{d.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Immobilie löschen?">
        <p className="mb-4 text-sm text-gray-600">
          Möchten Sie „{immo.strasse} {immo.hausnummer}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteModal(false)}>
            Abbrechen
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Wird gelöscht..." : "Endgültig löschen"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
