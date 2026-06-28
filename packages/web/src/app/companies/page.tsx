"use client";

import { useEffect, useState } from "react";
import { api, type CompanyWithScore } from "@/lib/api";
import { CATEGORIES } from "@/lib/categories";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Building2 } from "lucide-react";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .getTopCompanies(100, selectedCategory || undefined)
      .then((res) => setCompanies(res.companies))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("")}
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
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-ueno-blue text-white"
                : "bg-white text-gray-600 border hover:bg-gray-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Companies Grid */}
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
          <p>No hay empresas{selectedCategory ? ` en ${selectedCategory}` : ""}</p>
        </div>
      )}
    </div>
  );
}
