import { ScoreBadge } from "@/components/scoring/ScoreBadge";

interface ScoreBreakdownProps {
  scores: {
    audienceOverlap: number;
    ittiCompatibility: number;
    digitalPresence: number;
    reputation: number;
    categoryFit: number;
    locationFit: number;
    businessSize: number;
    alliancePotential: number;
  };
  weights?: {
    audienceOverlap: number;
    ittiCompatibility: number;
    digitalPresence: number;
    reputation: number;
    categoryFit: number;
    locationFit: number;
    businessSize: number;
    alliancePotential: number;
  };
}

const defaultWeights = {
  audienceOverlap: 25,
  ittiCompatibility: 20,
  digitalPresence: 15,
  reputation: 12,
  categoryFit: 10,
  locationFit: 8,
  businessSize: 5,
  alliancePotential: 5,
};

const labels: Record<string, string> = {
  audienceOverlap: "Audiencia",
  ittiCompatibility: "Compatibilidad Ueno",
  digitalPresence: "Presencia Digital",
  reputation: "Reputación",
  categoryFit: "Rubro",
  locationFit: "Ubicación",
  businessSize: "Tamaño",
  alliancePotential: "Potencial Alianza",
};

export function ScoreBreakdown({
  scores,
  weights = defaultWeights,
}: ScoreBreakdownProps) {
  return (
    <div className="space-y-3">
      {Object.entries(scores).map(([key, value]) => (
        <div key={key} className="flex items-center gap-3">
          <div className="w-40 text-sm text-gray-600">
            {labels[key] || key}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-ueno-blue h-2 rounded-full transition-all"
              style={{ width: `${value}%` }}
            />
          </div>
          <ScoreBadge score={value} size="sm" />
          <span className="text-xs text-gray-400 w-8">{weights[key as keyof typeof weights]}%</span>
        </div>
      ))}
    </div>
  );
}
