"use client";

import { useEffect, useState } from "react";
import {
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Globe,
  Instagram,
  Facebook,
  Search,
  BarChart3,
  Users,
  ExternalLink,
} from "lucide-react";

interface CompanyEnrichment {
  id: number;
  name: string;
  category: string;
  website: string | null;
  instagram: string | null;
  instagramFollowers: number | null;
  facebook: string | null;
  googleRating: string | null;
  googleReviews: number | null;
  lastScrapedAt: string | null;
  hasEnrichment: boolean;
  webTraffic: {
    monthlyVisits: number;
    bounceRate: number;
  } | null;
  facebookData: {
    followers: number;
    likes: number;
    rating: number;
  } | null;
  score: number | null;
  scoreLabel: string | null;
}

export default function EnrichmentPage() {
  const [companies, setCompanies] = useState<CompanyEnrichment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState<Set<number>>(new Set());
  const [analyzing, setAnalyzing] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<"all" | "enriched" | "pending">("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, [filter]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/enrich/companies?limit=100&enriched=${filter === "enriched" ? "true" : filter === "pending" ? "false" : ""}`);
      const data = await res.json();
      setCompanies(data.companies);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrich = async (companyId: number) => {
    setEnriching((prev) => new Set(prev).add(companyId));
    try {
      await fetch("/api/enrich/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      setMessage(`Enriqueciendo empresa #${companyId}...`);
      // Refresh after a delay
      setTimeout(fetchCompanies, 3000);
    } catch (err) {
      setMessage("Error al enriquecer");
    } finally {
      setEnriching((prev) => {
        const next = new Set(prev);
        next.delete(companyId);
        return next;
      });
    }
  };

  const handleAnalyze = async (companyId: number) => {
    setAnalyzing((prev) => new Set(prev).add(companyId));
    try {
      await fetch(`/api/scores/analyze/${companyId}?force=true`, {
        method: "POST",
      });
      setMessage(`Re-analizando empresa #${companyId}...`);
      setTimeout(fetchCompanies, 5000);
    } catch (err) {
      setMessage("Error al analizar");
    } finally {
      setAnalyzing((prev) => {
        const next = new Set(prev);
        next.delete(companyId);
        return next;
      });
    }
  };

  const handleEnrichAll = async (limit: number) => {
    setEnriching(new Set([-1])); // -1 = batch mode
    try {
      await fetch("/api/enrich/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: true, limit }),
      });
      setMessage(`Enriqueciendo ${limit} empresas...`);
      setTimeout(fetchCompanies, limit * 2000);
    } catch (err) {
      setMessage("Error al iniciar enriquecimiento");
    } finally {
      setEnriching(new Set());
    }
  };

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const enrichedCount = companies.filter((c) => c.hasEnrichment).length;
  const pendingCount = companies.filter((c) => !c.hasEnrichment).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900"> Enriquecimiento de Datos</h1>
      <p className="text-gray-500">
        Enriquece los datos de las empresas con Instagram, Facebook y tráfico web. Luego re-analiza para obtener scores más precisos.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold">{companies.length}</div>
          <div className="text-sm text-gray-500">Total empresas</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100">
          <div className="text-2xl font-bold text-green-600">{enrichedCount}</div>
          <div className="text-sm text-gray-500">Enriquecidas</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-yellow-100">
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-sm text-gray-500">Pendientes</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">
            {companies.filter((c) => c.score).length}
          </div>
          <div className="text-sm text-gray-500">Analizadas</div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Acciones</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleEnrichAll(10)}
            disabled={enriching.size > 0}
            className="flex items-center gap-2 bg-ueno-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {enriching.size > 0 ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Play size={18} />
            )}
            Enriquecer 10 empresas
          </button>
          <button
            onClick={() => handleEnrichAll(50)}
            disabled={enriching.size > 0}
            className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Enriquecer 50 empresas
          </button>
          <button
            onClick={fetchCompanies}
            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            <RefreshCw size={18} /> Actualizar
          </button>
        </div>
        {message && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
            {message}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {(["all", "enriched", "pending"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-ueno-blue text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "all" ? "Todas" : f === "enriched" ? "Enriquecidas" : "Pendientes"}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Companies Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-ueno-blue border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Empresa</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Instagram</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Facebook</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Web Traffic</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{company.name}</div>
                      <div className="text-xs text-gray-500">{company.category}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {company.instagramFollowers ? (
                      <div className="flex items-center gap-1 text-pink-600">
                        <Instagram size={14} />
                        <span className="text-sm font-medium">{formatNumber(company.instagramFollowers)}</span>
                      </div>
                    ) : company.instagram ? (
                      <span className="text-xs text-gray-400">@{company.instagram}</span>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {company.facebookData ? (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Facebook size={14} />
                        <span className="text-sm font-medium">{formatNumber(company.facebookData.followers)}</span>
                      </div>
                    ) : company.facebook ? (
                      <span className="text-xs text-gray-400">{company.facebook}</span>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {company.webTraffic ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <Globe size={14} />
                        <span className="text-sm font-medium">{formatNumber(company.webTraffic.monthlyVisits)}/mes</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {company.score ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        company.score >= 85 ? "bg-green-100 text-green-800" :
                        company.score >= 70 ? "bg-blue-100 text-blue-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {company.score}/100
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">Sin score</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {!company.hasEnrichment && (
                        <button
                          onClick={() => handleEnrich(company.id)}
                          disabled={enriching.has(company.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg text-xs font-medium hover:bg-pink-100 disabled:opacity-50"
                        >
                          {enriching.has(company.id) ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Play size={12} />
                          )}
                          Enriquecer
                        </button>
                      )}
                      {company.hasEnrichment && (
                        <button
                          onClick={() => handleAnalyze(company.id)}
                          disabled={analyzing.has(company.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 disabled:opacity-50"
                        >
                          {analyzing.has(company.id) ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <BarChart3 size={12} />
                          )}
                          Re-analizar
                        </button>
                      )}
                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron empresas
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Flujo de trabajo</h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-ueno-blue text-white rounded-full flex items-center justify-center font-bold">1</span>
            <span>Enriquecer empresas</span>
          </div>
          <div className="text-gray-300">→</div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-ueno-blue text-white rounded-full flex items-center justify-center font-bold">2</span>
            <span>Re-analizar con datos enriquecidos</span>
          </div>
          <div className="text-gray-300">→</div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-ueno-blue text-white rounded-full flex items-center justify-center font-bold">3</span>
            <span>Ver scores actualizados</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return String(num);
}
