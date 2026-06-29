"use client";

import { useState, useEffect } from "react";
import { api, type ChainRef, type BranchRef } from "@/lib/api";
import { Network, MapPin, Link2, Unlink, Search, X, Building2, ExternalLink } from "lucide-react";

interface BranchesSectionProps {
  companyId: number;
  companyName: string;
  parent?: ChainRef;
  branches?: BranchRef[];
  onUpdate: () => void;
}

export function BranchesSection({ companyId, companyName, parent, branches, onUpdate }: BranchesSectionProps) {
  const [showModal, setShowModal] = useState(false);

  // If this company is a branch (has parent), show minimal info
  if (parent) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Network size={18} className="text-purple-600" />
          <h2 className="text-lg font-semibold">Cadena</h2>
        </div>
        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
          <Building2 size={16} className="text-purple-600" />
          <div className="flex-1">
            <span className="text-sm text-gray-600">Sucursal de </span>
            <a href={`/companies/${parent.id}`} className="text-sm font-medium text-purple-700 hover:underline">
              {parent.name}
            </a>
          </div>
          <Link2 size={14} className="text-purple-400" />
        </div>
      </div>
    );
  }

  // If this is a parent company, show branches list
  return (
    <>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Network size={18} className="text-purple-600" />
            <h2 className="text-lg font-semibold">
              Cadena
              {branches && branches.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({branches.length} sucursal{branches.length > 1 ? "es" : ""})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
          >
            <Link2 size={14} />
            Vincular sucursal
          </button>
        </div>

        {branches && branches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {branches.map((branch) => (
              <a
                key={branch.id}
                href={`/companies/${branch.id}`}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-colors group"
              >
                <Building2 size={16} className="text-gray-400 mt-0.5 group-hover:text-purple-600" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate group-hover:text-purple-700">
                    {branch.name}
                  </div>
                  {branch.address && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin size={10} />
                      <span className="truncate">{branch.address}</span>
                    </div>
                  )}
                </div>
                <ExternalLink size={12} className="text-gray-300 group-hover:text-purple-500 mt-1" />
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400 text-sm">
            No hay sucursales vinculadas aún
          </div>
        )}
      </div>

      {showModal && (
        <LinkModal
          companyId={companyId}
          companyName={companyName}
          onClose={() => setShowModal(false)}
          onLinked={() => {
            setShowModal(false);
            onUpdate();
          }}
        />
      )}
    </>
  );
}

function LinkModal({
  companyId,
  companyName,
  onClose,
  onLinked,
}: {
  companyId: number;
  companyName: string;
  onClose: () => void;
  onLinked: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<(BranchRef & { similarity?: number })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BranchRef[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.getChainSuggestions(companyId)
      .then((res) => setSuggestions(res.suggestions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [companyId]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.search(searchQuery, { limit: 10 });
      setSearchResults(
        res.results
          .filter((r) => r.companyId !== companyId)
          .map((r) => ({
            id: r.companyId,
            name: r.name,
            address: r.address,
            category: r.category,
            city: r.city,
          }))
      );
    } catch {
      setMessage("Error al buscar");
    } finally {
      setSearching(false);
    }
  };

  const handleLink = async (targetId: number) => {
    setLinking(targetId);
    setMessage("");
    try {
      const res = await api.linkCompany(companyId, targetId);
      setMessage(res.message);
      onLinked();
    } catch (err: any) {
      setMessage(err.message || "Error al vincular");
    } finally {
      setLinking(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-900">Vincular sucursal</h3>
            <p className="text-sm text-gray-500">Buscar posibles sucursales de la misma cadena</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Buscar empresa por nombre..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              {searching ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {message && (
            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">{message}</div>
          )}

          {/* Search results */}
          {searchResults.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">Resultados de búsqueda</div>
              <div className="space-y-2">
                {searchResults.map((r) => (
                  <SuggestionRow
                    key={r.id}
                    company={r}
                    linking={linking === r.id}
                    onLink={() => handleLink(r.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* AI suggestions */}
          {loading ? (
            <div className="text-center py-4 text-gray-400 text-sm">Cargando sugerencias...</div>
          ) : suggestions.length > 0 ? (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">Posibles sucursales detectadas</div>
              <div className="space-y-2">
                {suggestions.map((s) => (
                  <SuggestionRow
                    key={s.id}
                    company={s}
                    similarity={s.similarity}
                    linking={linking === s.id}
                    onLink={() => handleLink(s.id)}
                  />
                ))}
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              No se encontraron sugerencias. Usá el buscador arriba.
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function SuggestionRow({
  company,
  similarity,
  linking,
  onLink,
}: {
  company: BranchRef;
  similarity?: number;
  linking: boolean;
  onLink: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors">
      <Building2 size={16} className="text-gray-400" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 truncate">{company.name}</div>
        {company.address && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <MapPin size={10} />
            <span className="truncate">{company.address}</span>
          </div>
        )}
      </div>
      {similarity !== undefined && (
        <span className="text-xs text-gray-400">{Math.round(similarity * 100)}%</span>
      )}
      <button
        onClick={onLink}
        disabled={linking}
        className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 disabled:opacity-50"
      >
        <Link2 size={12} />
        {linking ? "Vinculando..." : "Vincular"}
      </button>
    </div>
  );
}
