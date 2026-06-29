"use client";

import { useEffect, useState } from "react";
import { api, type ScrapeJob } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Play, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

export default function ScrapePage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState("");

  const loadJobs = () => {
    setLoading(true);
    setError("");
    api
      .getScrapeJobs()
      .then((res) => setJobs(res.jobs))
      .catch(() => setError("Error al cargar jobs."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleTrigger = async (source: string) => {
    setTriggering(true);
    try {
      await api.triggerScrape(source);
      setTimeout(loadJobs, 2000);
    } catch (err) {
      setError("Error al iniciar recolección.");
    } finally {
      setTriggering(false);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={16} className="text-green-500" />;
      case "failed":
        return <XCircle size={16} className="text-red-500" />;
      case "active":
        return <RefreshCw size={16} className="text-blue-500 animate-spin" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Recolección de Datos</h1>

      {/* Trigger Buttons */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Iniciar Recolecta</h2>
        <div className="flex gap-4">
          <button
            onClick={() => handleTrigger("google_places")}
            disabled={triggering}
            className="flex items-center gap-2 bg-ueno-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Play size={18} />
            Google Places
          </button>
          <button
            onClick={() => handleTrigger("directories")}
            disabled={triggering}
            className="flex items-center gap-2 bg-white border text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Play size={18} />
            Directorios
          </button>
          <button
            onClick={() => handleTrigger("web")}
            disabled={triggering}
            className="flex items-center gap-2 bg-white border text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Play size={18} />
            Sitios Web
          </button>
        </div>
      </div>

      {/* Jobs History */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Historial de Jobs</h2>
          <button
            onClick={loadJobs}
            className="text-sm text-ueno-blue hover:underline"
          >
            Actualizar
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {loading ? (
          <LoadingSpinner className="h-32" />
        ) : jobs.length > 0 ? (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center gap-4 p-3 rounded-lg border"
              >
                {statusIcon(job.status)}
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {job.source} · {job.category || "Todas"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(job.createdAt).toLocaleString("es-PY")}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div>
                    {job.totalFound} encontradas · {job.newCompanies} nuevas
                  </div>
                  <div
                    className={`text-xs font-medium ${
                      job.status === "completed"
                        ? "text-green-600"
                        : job.status === "failed"
                          ? "text-red-600"
                          : "text-gray-500"
                    }`}
                  >
                    {job.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No hay jobs de recolección aún
          </div>
        )}
      </div>
    </div>
  );
}
