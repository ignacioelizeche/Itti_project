"use client";

import { useEffect, useState } from "react";
import { api, type Stats, type CompanyWithScore } from "@/lib/api";
import { ScoreBadge } from "@/components/scoring/ScoreBadge";
import {
  Building2,
  TrendingUp,
  BarChart3,
  Users,
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topCompanies, setTopCompanies] = useState<CompanyWithScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getStats(), api.getTopCompanies(10)])
      .then(([s, c]) => {
        setStats(s);
        setTopCompanies(c.companies);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-ueno-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          icon={<Building2 size={20} />}
          label="Total Empresas"
          value={stats?.total || 0}
          color="bg-blue-500"
        />
        <KPICard
          icon={<TrendingUp size={20} />}
          label="Analizadas"
          value={stats?.analyzed || 0}
          color="bg-green-500"
        />
        <KPICard
          icon={<BarChart3 size={20} />}
          label="Score Promedio"
          value={stats?.averageScore || 0}
          suffix="/100"
          color="bg-purple-500"
        />
        <KPICard
          icon={<Users size={20} />}
          label="Pendientes"
          value={stats?.notAnalyzed || 0}
          color="bg-yellow-500"
        />
      </div>

      {/* Score Distribution */}
      {stats && stats.byLabel.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Distribución de Scores</h2>
          <div className="flex gap-4">
            {stats.byLabel.map((item) => (
              <div
                key={item.label}
                className="flex-1 text-center p-4 bg-gray-50 rounded-lg"
              >
                <div className="text-2xl font-bold">{item.count}</div>
                <div className="text-sm text-gray-500 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Companies */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Top 10 Empresas</h2>
        <div className="space-y-3">
          {topCompanies.map((company, i) => {
            const score = company.score ? Number(company.score.totalScore) : 0;
            return (
              <div
                key={company.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50"
              >
                <span className="text-lg font-bold text-gray-300 w-8">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {company.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {company.category}
                    {company.googleRating && ` · ⭐ ${company.googleRating}`}
                  </div>
                </div>
                <ScoreBadge score={score} size="sm" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
  suffix = "",
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`${color} text-white p-2 rounded-lg`}>{icon}</div>
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(value)}
            {suffix && (
              <span className="text-sm font-normal text-gray-400">{suffix}</span>
            )}
          </div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}
