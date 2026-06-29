"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { api, type CompanyWithScore, type Analysis, type ChainRef, type BranchRef } from "@/lib/api";
import type { EnrichedData } from "@/types";
import { ScoreRadar } from "@/components/scoring/ScoreRadar";
import { ScoreBreakdown } from "@/components/scoring/ScoreBreakdown";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { ContactDataSection } from "@/components/company/ContactDataSection";
import { EnrichedDataCards } from "@/components/company/EnrichedDataCards";
import { BranchesSection } from "@/components/company/BranchesSection";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CompanyDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [company, setCompany] = useState<
    CompanyWithScore & {
      analysis?: Analysis;
      dataSources?: EnrichedData;
      parent?: ChainRef;
      branches?: BranchRef[];
    } | null
  >(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");

  const fetchCompany = useCallback(() => {
    return api.getCompany(id)
      .then((data) => {
        setCompany(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const handleSave = async (editData: { website: string; instagram: string; facebook: string; phone: string }) => {
    setMessage("");
    try {
      const data = await api.updateCompany(id, editData);
      setMessage(data.message || "Datos actualizados");
      setCompany((prev) =>
        prev
          ? {
              ...prev,
              website: data.company.website,
              instagram: data.company.instagram,
              facebook: data.company.facebook,
            }
          : prev
      );
      if (data.message?.includes("Enriqueciendo")) {
        setTimeout(async () => {
          const updated = await api.getCompany(id);
          setCompany(updated);
        }, 5000);
      }
    } catch {
      setMessage("Error al guardar");
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setMessage("");
    try {
      const res = await api.analyzeCompany(Number(id), true);
      setMessage(res.message || "Procesando (enriquecimiento + análisis)...");
      pollRef.current = setInterval(async () => {
        try {
          const updated = await api.getCompany(id);
          if (updated.score) {
            setCompany(updated);
            setMessage("Análisis completado");
            if (pollRef.current) clearInterval(pollRef.current);
            if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
          }
        } catch {}
      }, 5000);
      pollTimeoutRef.current = setTimeout(() => {
        if (pollRef.current) clearInterval(pollRef.current);
      }, 60000);
    } catch {
      setMessage("Error al analizar");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDecide = async (decision: "approved" | "rejected") => {
    const res = await api.decide(id, decision);
    setMessage(res.message);
    setCompany((prev) => prev ? { ...prev, humanDecision: decision } as any : prev);
  };

  const score = company?.score ? Number(company.score.totalScore) : null;
  const dataSources = company ? (company as any).dataSources as EnrichedData | undefined : undefined;

  const scoreBreakdown = useMemo(() => company?.score ? {
    audienceOverlap: Number(company.score.audienceOverlap),
    ittiCompatibility: Number(company.score.ittiCompatibility),
    digitalPresence: Number(company.score.digitalPresence),
    reputation: Number(company.score.reputation),
    categoryFit: Number(company.score.categoryFit),
    locationFit: Number(company.score.locationFit),
    businessSize: Number(company.score.businessSize),
    alliancePotential: Number(company.score.alliancePotential),
  } : null, [company?.score]);

  if (loading) {
    return <LoadingSpinner className="h-64" />;
  }

  if (!company) {
    return (
      <div className="text-center py-12 text-gray-500">Empresa no encontrada</div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/companies"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Volver
      </Link>

      <CompanyHeader
        company={company}
        score={score}
        analyzing={analyzing}
        message={message}
        onAnalyze={handleAnalyze}
        onDecide={handleDecide}
      />

      <ContactDataSection
        website={company.website || ""}
        instagram={company.instagram || ""}
        facebook={company.facebook || ""}
        phone={(company as any).phone || ""}
        onSave={handleSave}
      />

      <EnrichedDataCards dataSources={dataSources} company={company} />

      <BranchesSection
        companyId={company.id}
        companyName={company.name}
        parent={(company as any).parent}
        branches={(company as any).branches}
        onUpdate={fetchCompany}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scoreBreakdown && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Desglose de Score</h2>
            <ScoreRadar scores={scoreBreakdown} />
          </div>
        )}
        {scoreBreakdown && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Criterios</h2>
            <ScoreBreakdown scores={scoreBreakdown} />
          </div>
        )}
      </div>

      {company.analysis?.recommendation && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Análisis IA</h2>
          <div className="prose prose-sm max-w-none text-gray-700">
            {company.analysis.recommendation}
          </div>
        </div>
      )}
    </div>
  );
}
