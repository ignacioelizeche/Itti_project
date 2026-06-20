"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, type CompanyWithScore, type Analysis } from "@/lib/api";
import { ScoreBadge } from "@/components/scoring/ScoreBadge";
import { ScoreRadar } from "@/components/scoring/ScoreRadar";
import { ScoreBreakdown } from "@/components/scoring/ScoreBreakdown";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Star,
  Instagram,
  Facebook,
  Globe,
  Phone,
  Save,
  RefreshCw,
  Pencil,
  X,
  Check,
} from "lucide-react";
import Link from "next/link";

interface EnrichedData {
  webTraffic?: {
    monthlyVisits: number;
    bounceRate: number;
    pagesPerVisit: number;
    rank: number;
  };
  facebookData?: {
    followers: number;
    likes: number;
    rating: number;
    reviewCount: number;
  };
}

export default function CompanyDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [company, setCompany] = useState<
    CompanyWithScore & { analysis?: Analysis; dataSources?: EnrichedData } | null
  >(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    website: "",
    instagram: "",
    facebook: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .getTopCompanies(1000)
      .then((res) => {
        const found = res.companies.find((c) => c.id === id);
        if (found) {
          return api.search(found.name, { limit: 1 }).then((searchRes) => {
            const match = searchRes.results.find((r) => r.companyId === id);
            setCompany({
              ...found,
              analysis: match
                ? {
                    summary: match.summary,
                    recommendation: match.recommendation,
                    strengths: null,
                    weaknesses: null,
                  }
                : undefined,
            });
            setEditData({
              website: found.website || "",
              instagram: found.instagram || "",
              facebook: found.facebook || "",
              phone: (found as any).phone || "",
            });
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/scores/company/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Datos actualizados");
        setEditing(false);
        // Update local state
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
      } else {
        setMessage(data.error || "Error al guardar");
      }
    } catch (err) {
      setMessage("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setMessage("");
    try {
      const res = await fetch(`/api/scores/analyze/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      setMessage(data.message || "Análisis iniciado");
      // Refresh data after a delay
      setTimeout(() => {
        window.location.reload();
      }, 15000);
    } catch (err) {
      setMessage("Error al analizar");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-ueno-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12 text-gray-500">Empresa no encontrada</div>
    );
  }

  const score = company.score ? Number(company.score.totalScore) : null;
  const dataSources = (company as any).dataSources as EnrichedData | undefined;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/companies"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Volver
      </Link>

      {/* Header */}
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
                  <Star
                    size={14}
                    className="text-yellow-500"
                    fill="currentColor"
                  />
                  {company.googleRating} ({company.googleReviews || 0} reseñas)
                </span>
              )}
              {company.allianceStatus === "active" && (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  Aliado Ueno+ Activo
                </span>
              )}
            </div>
            {company.allianceDetails?.benefit && (
              <div className="mt-3 text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                <strong>Beneficio actual:</strong>{" "}
                {company.allianceDetails.benefit}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {score !== null && <ScoreBadge score={score} size="lg" showLabel />}
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center gap-2 px-4 py-2 bg-ueno-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              {analyzing ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              {analyzing ? "Analizando..." : "Re-analizar"}
            </button>
          </div>
        </div>
        {message && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
            {message}
          </div>
        )}
      </div>

      {/* Edit Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Datos de Contacto</h2>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Save size={12} />
                  )}
                  Guardar
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                  <X size={12} /> Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                <Pencil size={12} /> Editar
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Globe size={14} className="inline mr-1" />
              Sitio Web
            </label>
            {editing ? (
              <input
                type="url"
                value={editData.website}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, website: e.target.value }))
                }
                placeholder="https://ejemplo.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            ) : (
              <div className="text-sm text-gray-600">
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ueno-blue hover:underline flex items-center gap-1"
                  >
                    {company.website} <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-gray-300">No configurado</span>
                )}
              </div>
            )}
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Instagram size={14} className="inline mr-1" />
              Instagram
            </label>
            {editing ? (
              <input
                type="text"
                value={editData.instagram}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, instagram: e.target.value }))
                }
                placeholder="@usuario"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            ) : (
              <div className="text-sm text-gray-600">
                {company.instagram ? (
                  <a
                    href={`https://instagram.com/${company.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:underline flex items-center gap-1"
                  >
                    @{company.instagram} <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-gray-300">No configurado</span>
                )}
              </div>
            )}
          </div>

          {/* Facebook */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Facebook size={14} className="inline mr-1" />
              Facebook
            </label>
            {editing ? (
              <input
                type="text"
                value={editData.facebook}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, facebook: e.target.value }))
                }
                placeholder="pagina o URL"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            ) : (
              <div className="text-sm text-gray-600">
                {company.facebook ? (
                  <a
                    href={`https://facebook.com/${company.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {company.facebook} <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-gray-300">No configurado</span>
                )}
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone size={14} className="inline mr-1" />
              Teléfono
            </label>
            {editing ? (
              <input
                type="tel"
                value={editData.phone}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="(021) 123 456"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            ) : (
              <div className="text-sm text-gray-600">
                {(company as any).phone || (
                  <span className="text-gray-300">No configurado</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enriched Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Instagram */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Instagram size={18} className="text-pink-600" />
            <h3 className="font-medium text-gray-900">Instagram</h3>
          </div>
          {company.instagramFollowers ? (
            <div>
              <div className="text-2xl font-bold text-pink-600">
                {formatNumber(company.instagramFollowers)}
              </div>
              <div className="text-sm text-gray-500">seguidores</div>
            </div>
          ) : (
            <div className="text-sm text-gray-300">Sin datos</div>
          )}
        </div>

        {/* Facebook */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Facebook size={18} className="text-blue-600" />
            <h3 className="font-medium text-gray-900">Facebook</h3>
          </div>
          {dataSources?.facebookData ? (
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(dataSources.facebookData.followers)}
              </div>
              <div className="text-sm text-gray-500">seguidores</div>
            </div>
          ) : (
            <div className="text-sm text-gray-300">Sin datos</div>
          )}
        </div>

        {/* Web Traffic */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={18} className="text-green-600" />
            <h3 className="font-medium text-gray-900">Tráfico Web</h3>
          </div>
          {dataSources?.webTraffic ? (
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(dataSources.webTraffic.monthlyVisits)}
              </div>
              <div className="text-sm text-gray-500">visitas/mes</div>
            </div>
          ) : (
            <div className="text-sm text-gray-300">Sin datos</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        {company.score && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Desglose de Score</h2>
            <ScoreRadar
              scores={{
                audienceOverlap: Number(company.score.audienceOverlap),
                ittiCompatibility: Number(company.score.ittiCompatibility),
                digitalPresence: Number(company.score.digitalPresence),
                reputation: Number(company.score.reputation),
                categoryFit: Number(company.score.categoryFit),
                locationFit: Number(company.score.locationFit),
                businessSize: Number(company.score.businessSize),
                alliancePotential: Number(company.score.alliancePotential),
              }}
            />
          </div>
        )}

        {/* Score Breakdown */}
        {company.score && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Criterios</h2>
            <ScoreBreakdown
              scores={{
                audienceOverlap: Number(company.score.audienceOverlap),
                ittiCompatibility: Number(company.score.ittiCompatibility),
                digitalPresence: Number(company.score.digitalPresence),
                reputation: Number(company.score.reputation),
                categoryFit: Number(company.score.categoryFit),
                locationFit: Number(company.score.locationFit),
                businessSize: Number(company.score.businessSize),
                alliancePotential: Number(company.score.alliancePotential),
              }}
            />
          </div>
        )}
      </div>

      {/* Analysis */}
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

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return String(num);
}
