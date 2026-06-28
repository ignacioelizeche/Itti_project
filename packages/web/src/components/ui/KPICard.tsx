"use client";

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: string;
}

export function KPICard({ icon, label, value, suffix = "", color }: KPICardProps) {
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
