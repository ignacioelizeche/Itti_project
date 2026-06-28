"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { RefreshCw, Search, ExternalLink, Check, X } from "lucide-react";

interface CompanyDecision {
  id: number;
  name: string;
  category: string;
  website: string | null;
  instagramFollowers: number | null;
  score: number | null;
  scoreLabel: string | null;
  humanDecision: string | null;
  humanNote: string | null;
  decidedAt: string | null;
}

export default function DecisionsPage() {
  const [companies, setCompanies] = useState<CompanyDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "decided">("pending");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { fetchDecisions(); }, [filter]);

  const fetchDecisions = async () => {
    setLoading(true);
    try {
      const res = await api.getDecisions(filter === "all" ? "" : filter);
      setCompanies(res.companies);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (companyId: number, decision: "approved" | "rejected") => {
    try {
      const res = await api.decide(companyId, decision);
      setMessage(res.message);
      setCompanies((prev) => prev.map((c) => c.id === companyId ? { ...c, humanDecision: decision, decidedAt: new Date().toISOString() } : c));
    } catch {
      setMessage("Error al guardar decisión");
    }
  };

  const filtered = companies.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const pendingCount = companies.filter((c) => !c.humanDecision).length;
  const decidedCount = companies.filter((c) => c.humanDecision).length;
  const approvedCount = companies.filter((c) => c.humanDecision === "approved").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Decisiones de Alianzas</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold">{companies.length}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-yellow-100">
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-sm text-gray-500">Pendientes</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100">
          <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          <div className="text-sm text-gray-500">Aprobadas</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-red-100">
          <div className="text-2xl font-bold text-red-600">{decidedCount - approvedCount}</div>
          <div className="text-sm text-gray-500">Rechazadas</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {(["all", "pending", "decided"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? "bg-ueno-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {f === "all" ? "Todas" : f === "pending" ? "Pendientes" : "Decididas"}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar empresa..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <button onClick={fetchDecisions}
            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300">
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>
        {message && <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">{message}</div>}
      </div>

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
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Decisión</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{company.name}</div>
                    <div className="text-xs text-gray-500">{company.category}</div>
                    {company.instagramFollowers && (
                      <div className="text-xs text-pink-600">{formatNumber(company.instagramFollowers)} seguidores</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {company.score ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        company.score >= 85 ? "bg-green-100 text-green-800" :
                        company.score >= 70 ? "bg-blue-100 text-blue-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {company.score}/100 {company.scoreLabel && `- ${company.scoreLabel}`}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">Sin análisis</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {company.humanDecision ? (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        company.humanDecision === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {company.humanDecision === "approved" ? <Check size={12} /> : <X size={12} />}
                        {company.humanDecision === "approved" ? "Aprobado" : "Rechazado"}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">Pendiente</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {company.score && (
                        <>
                          <button onClick={() => handleDecision(company.id, "approved")}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                              company.humanDecision === "approved" 
                                ? "bg-green-200 text-green-800" 
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}>
                            <Check size={12} /> Aprobar
                          </button>
                          <button onClick={() => handleDecision(company.id, "rejected")}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                              company.humanDecision === "rejected" 
                                ? "bg-red-200 text-red-800" 
                                : "bg-red-50 text-red-600 hover:bg-red-100"
                            }`}>
                            <X size={12} /> Rechazar
                          </button>
                        </>
                      )}
                      <a href={`/companies/${company.id}`} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-gray-600">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-8 text-gray-500">No se encontraron empresas</div>}
        </div>
      )}
    </div>
  );
}


