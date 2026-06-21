"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, type SearchResult } from "@/lib/api";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { Search } from "lucide-react";

const CATEGORIES = [
  "Gastronomía", "Moda", "Deportes", "Supermercados", "Bienestar",
  "Educación", "Tecnología", "Entretenimiento", "Hoteles", "Combustibles", "Farmacias",
];

export default function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [minScore, setMinScore] = useState<number | "">("");

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await api.search(query, {
        limit: 20,
        category: category || undefined,
        minScore: minScore ? Number(minScore) : undefined,
      });
      setResults(res.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) handleSearch();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Búsqueda Semántica</h1>

      <form onSubmit={handleSearch} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cafeterías populares en Asunción con buena presencia en Instagram..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ueno-blue/50" />
          </div>
          <button type="submit" className="bg-ueno-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors">
            Buscar
          </button>
        </div>
        <div className="flex gap-4 mt-4">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2 border rounded-lg text-sm bg-white">
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input type="number" value={minScore} onChange={(e) => setMinScore(e.target.value ? Number(e.target.value) : "")}
            placeholder="Score mínimo" min={0} max={100} className="px-4 py-2 border rounded-lg text-sm w-36" />
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin w-8 h-8 border-4 border-ueno-blue border-t-transparent rounded-full" />
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{results.length} resultados encontrados</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((r) => (
              <div key={r.companyId} className="relative">
                <CompanyCard company={{
                  id: r.companyId, name: r.name, slug: "", category: r.category, subcategory: r.subcategory,
                  description: null, address: r.address, city: r.city, phone: null, website: null,
                  instagram: null, instagramFollowers: null, facebook: null, googleRating: r.googleRating,
                  googleReviews: r.googleReviews, allianceStatus: null, allianceDetails: null, score: r.score,
                }} />
                <div className="absolute top-3 right-3 bg-gray-900/80 text-white text-xs px-2 py-1 rounded">
                  {(r.similarity * 100).toFixed(0)}% match
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : query && !loading ? (
        <div className="text-center py-12 text-gray-500">No se encontraron resultados para &quot;{query}&quot;</div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>Escribí tu búsqueda en lenguaje natural</p>
          <p className="text-sm mt-2">Ej: &quot;cafeterías populares en Asunción con buena presencia en Instagram&quot;</p>
        </div>
      )}
    </div>
  );
}
