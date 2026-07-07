"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { DiscoveredCompany } from "@/types";
import { Search, Sparkles, Star, MapPin, ExternalLink, Plus, Check } from "lucide-react";

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiscoveredCompany[]>([]);
  const [generatedQueries, setGeneratedQueries] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState("");

  const handleSearch = async () => {
    if (!query.trim() || query.trim().length < 3) return;

    setLoading(true);
    setResults([]);
    setGeneratedQueries([]);
    setMessage("");
    setProgress("Iniciando...");

    try {
      for await (const event of api.discoverStream(query.trim(), true)) {
        switch (event.event) {
          case "progress":
            setProgress(event.data.message);
            break;
          case "queries":
            setGeneratedQueries(event.data.queries);
            setProgress("Buscando empresas en Google Places...");
            break;
          case "result":
            setResults(event.data.companies);
            setMessage(`Encontré ${event.data.totalFound} empresas. ${event.data.newCompanies} nuevas se están enriqueciendo automáticamente.`);
            setProgress("");
            break;
          case "error":
            setMessage("Error: " + event.data.error);
            setProgress("");
            break;
        }
      }
    } catch (err) {
      setMessage("Error de conexión");
      setProgress("");
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    "Restaurantes saludables con buen Instagram en Asunción",
    "Gimnasios y fitness para jóvenes con buena reputación",
    "Cafeterías modernas con presencia digital fuerte",
    "Tiendas de moda urbana con engagement alto",
    "Negocios de delivery con buena reputación online",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="text-ueno-blue" size={28} />
        <h1 className="text-2xl font-bold text-gray-900">Descubrir Alianzas</h1>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <p className="text-gray-600 mb-4">
          Describí lo que buscás y la IA genera automáticamente las mejores búsquedas en Google Places.
        </p>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ej: Gimnasios modernos con buena reputación en Asunción..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              aria-label="Describir empresa a descubrir"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ueno-blue focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || query.trim().length < 3}
            className="flex items-center gap-2 bg-ueno-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-ueno-blue/90 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                {progress || "Buscando..."}
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Descubrir
              </>
            )}
          </button>
        </div>

        {generatedQueries.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-xs font-medium text-blue-700 mb-2">Consultas generadas:</div>
            <div className="flex flex-wrap gap-2">
              {generatedQueries.map((q, i) => (
                <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{q}</span>
              ))}
            </div>
          </div>
        )}

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}>
            {message}
          </div>
        )}
      </div>

      {results.length === 0 && !loading && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Ejemplos de búsquedas:</h2>
          <div className="flex flex-wrap gap-3">
            {exampleQueries.map((example, i) => (
              <button
                key={i}
                onClick={() => setQuery(example)}
                className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Resultados ({results.length})</h2>
          </div>
          <table className="w-full" aria-label="Resultados del descubrimiento">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Empresa</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{company.name}</div>
                    <div className="text-xs text-gray-500">{company.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <MapPin size={14} />
                      {company.address?.substring(0, 40)}{company.address?.length > 40 ? "..." : ""}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {company.googleRating ? (
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{company.googleRating}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {company.isNew ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        <Plus size={12} /> Nueva
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        <Check size={12} /> Ya existía
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/companies/${company.id}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-ueno-blue hover:underline">
                        Ver detalle
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
