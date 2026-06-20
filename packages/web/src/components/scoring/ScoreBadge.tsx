interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function getColor(score: number) {
  if (score >= 85) return "bg-green-500";
  if (score >= 70) return "bg-blue-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function getLabel(score: number) {
  if (score >= 85) return "Muy recomendable";
  if (score >= 70) return "Buena candidata";
  if (score >= 50) return "Moderada";
  return "Baja afinidad";
}

export function ScoreBadge({ score, size = "md", showLabel = false }: ScoreBadgeProps) {
  const sizeClasses = {
    sm: "w-10 h-10 text-xs",
    md: "w-14 h-14 text-sm",
    lg: "w-20 h-20 text-lg",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} ${getColor(score)} text-white rounded-full flex items-center justify-center font-bold`}
      >
        {score}
      </div>
      {showLabel && (
        <span className="text-sm text-gray-600">{getLabel(score)}</span>
      )}
    </div>
  );
}
