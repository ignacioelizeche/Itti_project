"use client";

import { useEffect, useState } from "react";
import { api, type CompanyWithScore } from "@/lib/api";
import { CATEGORIES } from "@/lib/categories";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Building2, EyeOff, Eye } from "lucide-react";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [hideAllied, setHideAllied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .getTopCompanies(100, selectedCategory || undefined, hideAllied)
      .then((res) => setCompanies(res.companies))
      .catch(() => setError("Error al cargar empresas."))
      .finally(() => setLoading(false));
  }, [selectedCategory, hideAllied]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedCategory("")}
          aria-pressed={!selectedCategory}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !selectedCategory
              ? "bg-ueno-blue text-white"
              : "bg-white text-gray-600 border hover:bg-gray-50"
          }`}
        >
          Todas
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            aria-pressed={selectedCategory === cat}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-ueno-blue text-white"
                : "bg-white text-gray-600 border hover:bg-gray-50"
            }`}
          >
            {cat}
          </button>
        ))}
        <div className="ml-auto">
          <button
            onClick={() => setHideAllied(!hideAllied)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              hideAllied
                ? "bg-orange-100 text-orange-700 border border-orange-200"
                : "bg-white text-gray-600 border hover:bg-gray-50"
            }`}
          >
            {hideAllied ? <EyeOff size={14} /> : <Eye size={14} />}
            {hideAllied ? "Aliadas ocultas" : "Ocultar aliadas"}
          </button>
        </div>
      </div>

      {/* Companies Grid */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}
      {loading ? (
        <LoadingSpinner className="h-32" />
      ) : companies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Building2 size={48} className="mx-auto mb-4 opacity-50" />
          <p>No hay empresas{selectedCategory ? ` en ${selectedCategory}` : ""}{hideAllied ? " (aliadas ocultas)" : ""}</p>
        </div>
      )}
    </div>
  );
}
