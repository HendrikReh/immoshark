import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { DashboardStats, Immobilie } from "@immoshark/shared";
import { api } from "../api/client";
import { formatPreis, typLabel } from "../lib/utils";
import { StatusBadge } from "../components/immobilien/StatusBadge";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Immobilie[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.stats().then((r) => setStats(r.data)),
      api.list({ limit: 5 }).then((r) => setRecent(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center text-gray-500">Laden...</div>;

  const statCards = stats
    ? [
        { label: "Gesamt", value: stats.gesamt, color: "bg-shark text-white" },
        { label: "Verfügbar", value: stats.verfuegbar, color: "bg-green-500 text-white" },
        { label: "Reserviert", value: stats.reserviert, color: "bg-yellow-500 text-white" },
        { label: "Verkauft", value: stats.verkauft, color: "bg-red-500 text-white" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Übersicht Ihrer Immobilien</p>
        </div>
        <Link to="/immobilien/neu">
          <Button>Neu anlegen</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-xl p-5 shadow-sm ${card.color}`}>
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="mt-1 text-sm opacity-90">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Search */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (search.trim()) {
              window.location.assign(`/immobilien?suche=${encodeURIComponent(search)}`);
            }
          }}
        >
          <Input
            placeholder="Suche nach ...?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">Suchen</Button>
        </form>
      </div>

      {/* Type breakdown */}
      {stats && Object.keys(stats.nach_typ).length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(stats.nach_typ).map(([typ, count]) => (
            <Link
              key={typ}
              to={`/immobilien?typ=${typ}`}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-2xl font-bold text-shark">{count}</p>
              <p className="text-sm text-gray-600">{typLabel(typ)}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Average price */}
      {stats?.durchschnittspreis && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Durchschnittspreis</p>
          <p className="text-2xl font-bold text-shark">{formatPreis(stats.durchschnittspreis)}</p>
        </div>
      )}

      {/* Recent */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-3">
          <h2 className="font-semibold text-gray-900">Zuletzt hinzugefügt</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {recent.map((immo) => (
            <li key={immo.id}>
              <Link
                to={`/immobilien/${immo.id}`}
                className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {immo.strasse} {immo.hausnummer}
                  </p>
                  <p className="text-sm text-gray-500">
                    {immo.plz} {immo.ort} · {typLabel(immo.typ)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-shark">{formatPreis(immo.preis)}</span>
                  <StatusBadge status={immo.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
