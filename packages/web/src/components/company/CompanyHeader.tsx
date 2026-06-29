"use client";

import { RefreshCw, MapPin, Star, Check, X, Network } from "lucide-react";
import { ScoreBadge } from "@/components/scoring/ScoreBadge";
import type { CompanyWithScore, Analysis, ChainRef, BranchRef } from "@/lib/api";
import type { EnrichedData } from "@/types";

interface CompanyHeaderProps {
  company: CompanyWithScore & { analysis?: Analysis; dataSources?: EnrichedData; parent?: ChainRef; branches?: BranchRef[] };
  score: number | null;
  analyzing: boolean;
  message: string;
  onAnalyze: () => void;
  onDecide: (decision: "approved" | "rejected") => void;
}

export function CompanyHeader({
  company,
  score,
  analyzing,
  message,
  onAnalyze,
  onDecide,
}: CompanyHeaderProps) {
  const decision = (company as any).humanDecision as string | undefined;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-gray-500 mt-1">
            {company.category}
            {company.subcategory && ` · ${company.subcategory}`}
          </p>
          {company.address && (
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
              <MapPin size={14} /> {company.address}
            </div>
          )}
          <div className="flex items-center gap-4 mt-3">
            {company.googleRating && (
              <span className="flex items-center gap-1 text-sm">
                <Star size={14} className="text-yellow-500" fill="currentColor" />
                {company.googleRating} ({company.googleReviews || 0} reseñas)
              </span>
            )}
            {company.allianceStatus === "active" && (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                Aliado Ueno+ Activo
              </span>
            )}
            {company.parent && (
              <a
                href={`/companies/${company.parent.id}`}
                className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium hover:bg-purple-200 transition-colors"
              >
                <Network size={12} />
                Sucursal de {company.parent.name}
              </a>
            )}
            {company.branches && company.branches.length > 0 && (
              <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                <Network size={12} />
                {company.branches.length} sucursal{company.branches.length > 1 ? "es" : ""}
              </span>
            )}
          </div>
          {company.allianceDetails?.benefit && (
            <div className="mt-3 text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
              <strong>Beneficio actual:</strong> {company.allianceDetails.benefit}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {score !== null && <ScoreBadge score={score} size="lg" showLabel />}
          <button
            onClick={onAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {analyzing ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            {analyzing ? "Procesando..." : "Enriquecer + Analizar"}
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
          {message}
        </div>
      )}

      {score !== null && (
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-gray-500">Decisión:</span>
          {decision && (
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              decision === "approved"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}>
              {decision === "approved" ? "✓ Aprobado" : "✗ Rechazado"}
            </span>
          )}
          <button
            onClick={() => onDecide("approved")}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium ${
              decision === "approved"
                ? "bg-green-200 text-green-800"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            <Check size={14} /> Aprobar
          </button>
          <button
            onClick={() => onDecide("rejected")}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium ${
              decision === "rejected"
                ? "bg-red-200 text-red-800"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
          >
            <X size={14} /> Rechazar
          </button>
        </div>
      )}
    </div>
  );
}
