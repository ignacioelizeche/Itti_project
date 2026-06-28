"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, type CompanyWithScore, type Analysis } from "@/lib/api";
import type { EnrichedData } from "@/types";
import { ScoreBadge } from "@/components/scoring/ScoreBadge";
import { ScoreRadar } from "@/components/scoring/ScoreRadar";
import { ScoreBreakdown } from "@/components/scoring/ScoreBreakdown";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatNumber } from "@/lib/utils";
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
    api.getCompany(id)
      .then((data) => {
        setCompany(data);
        setEditData({
          website: data.website || "",
          instagram: data.instagram || "",
          facebook: data.facebook || "",
          phone: data.phone || "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const data = await api.updateCompany(id, editData);
      setMessage(data.message || "Datos actualizados");
      setEditing(false);
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
      const res = await api.analyzeCompany(Number(id), true);
      setMessage(res.message || "Procesando (enriquecimiento + análisis)...");
      // Poll for results
      const poll = setInterval(async () => {
        try {
          const updated = await api.getCompany(id);
          if (updated.score) {
            setCompany(updated);
            setMessage("Análisis completado");
            clearInterval(poll);
          }
        } catch {}
      }, 5000);
      // Stop polling after 60s
      setTimeout(() => clearInterval(poll), 60000);
    } catch {
      setMessage("Error al analizar");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner className="h-64" />;
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

        {/* Decision Buttons */}
        {score !== null && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-500">Decisión:</span>
            {(company as any).humanDecision && (
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                (company as any).humanDecision === "approved"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}>
                {(company as any).humanDecision === "approved" ? "✓ Aprobado" : "✗ Rechazado"}
              </span>
            )}
            <button
              onClick={async () => {
                const res = await api.decide(id, "approved");
                setMessage(res.message);
                setCompany((prev) => prev ? { ...prev, humanDecision: "approved" } as any : prev);
              }}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium ${
                (company as any).humanDecision === "approved"
                  ? "bg-green-200 text-green-800"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              <Check size={14} /> Aprobar
            </button>
            <button
              onClick={async () => {
                const res = await api.decide(id, "rejected");
                setMessage(res.message);
                setCompany((prev) => prev ? { ...prev, humanDecision: "rejected" } as any : prev);
              }}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium ${
                (company as any).humanDecision === "rejected"
                  ? "bg-red-200 text-red-800"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              <X size={14} /> Rechazar
            </button>
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
            {dataSources?.instagram?.isVerified && (
              <span className="text-blue-500 text-xs font-bold">✓ Verificado</span>
            )}
          </div>
          {dataSources?.instagram ? (
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold text-pink-600">
                  {formatNumber(dataSources.instagram.followersCount)}
                </div>
                <div className="text-sm text-gray-500">seguidores</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Posts</span>
                  <div className="font-medium">{formatNumber(dataSources.instagram.postsCount)}</div>
                </div>
                <div>
                  <span className="text-gray-400">Engagement</span>
                  <div className="font-medium">{dataSources.instagram.engagementRate}%</div>
                </div>
                <div>
                  <span className="text-gray-400">Likes/post</span>
                  <div className="font-medium">{formatNumber(dataSources.instagram.avgLikes)}</div>
                </div>
                <div>
                  <span className="text-gray-400">Comments/post</span>
                  <div className="font-medium">{formatNumber(dataSources.instagram.avgComments)}</div>
                </div>
              </div>
              {dataSources.instagram.biography && (
                <div className="text-xs text-gray-400 truncate">{dataSources.instagram.biography}</div>
              )}
            </div>
          ) : company.instagramFollowers ? (
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
          {dataSources?.facebookData?.followers ? (
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(dataSources.facebookData.followers)}
              </div>
              <div className="text-sm text-gray-500">seguidores</div>
            </div>
          ) : company.facebook ? (
            <div>
              <a
                href={`https://facebook.com/${company.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                {company.facebook} <ExternalLink size={12} />
              </a>
              <div className="text-xs text-gray-400 mt-1">Sin datos de tráfico</div>
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
          {dataSources?.webTraffic?.monthlyVisits ? (
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(dataSources.webTraffic.monthlyVisits)}
              </div>
              <div className="text-sm text-gray-500">visitas/mes</div>
            </div>
          ) : company.website ? (
            <div>
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:underline flex items-center gap-1"
              >
                {company.website.replace(/^https?:\/\//, "").replace(/^www\./, "")} <ExternalLink size={12} />
              </a>
              <div className="text-xs text-gray-400 mt-1">Sin datos de tráfico</div>
            </div>
          ) : (
            <div className="text-sm text-gray-300">Sin sitio web</div>
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


