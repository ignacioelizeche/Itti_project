"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface ScoreRadarProps {
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
}

export function ScoreRadar({ scores }: ScoreRadarProps) {
  const data = [
    { subject: "Audiencia", value: scores.audienceOverlap },
    { subject: "Compatibilidad", value: scores.ittiCompatibility },
    { subject: "Digital", value: scores.digitalPresence },
    { subject: "Reputación", value: scores.reputation },
    { subject: "Rubro", value: scores.categoryFit },
    { subject: "Ubicación", value: scores.locationFit },
    { subject: "Tamaño", value: scores.businessSize },
    { subject: "Potencial", value: scores.alliancePotential },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#E2E8F0" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#64748B", fontSize: 11 }}
        />
        <Radar
          dataKey="value"
          stroke="#0066FF"
          fill="#0066FF"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
