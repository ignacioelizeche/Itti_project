"use client";

import { useEffect, useState } from "react";
import { api, type Stats } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Play, RefreshCw } from "lucide-react";

export default function ScoringPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch(() => setError("Error al cargar estadísticas."))
      .finally(() => setLoading(false));
  }, []);

  const handleAnalyzeAll = async () => {
    setAnalyzing(true);
    setMessage("");
    try {
      const res = await api.analyzeBatch(undefined, 100);
      setMessage(res.message);
    } catch {
      setMessage("Error al iniciar análisis");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner className="h-64" />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Scoring IA</h1>
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Scoring IA</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold">{stats?.analyzed || 0}</div>
          <div className="text-sm text-gray-500">Analizadas</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold">{stats?.notAnalyzed || 0}</div>
          <div className="text-sm text-gray-500">Pendientes</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold">{Math.round(stats?.averageScore || 0)}</div>
          <div className="text-sm text-gray-500">Score Promedio</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Acciones</h2>
        <div className="flex gap-4">
          <button
            onClick={handleAnalyzeAll}
            disabled={analyzing}
            aria-label="Analizar empresas pendientes"
            className="flex items-center gap-2 bg-ueno-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {analyzing ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />}
            {analyzing ? "Analizando..." : "Analizar Pendientes"}
          </button>
        </div>
        {message && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>
        )}
      </div>
    </div>
  );
}
