import Link from "next/link";
import { ScoreBadge } from "@/components/scoring/ScoreBadge";
import type { CompanyWithScore } from "@/lib/api";

interface CompanyCardProps {
  company: CompanyWithScore;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const scoreNum = company.score ? Number(company.score.totalScore) : null;

  return (
    <Link
      href={`/companies/${company.id}`}
      className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{company.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {company.category}
            {company.subcategory && ` · ${company.subcategory}`}
          </p>
          {company.address && (
            <p className="text-xs text-gray-400 mt-2 truncate">{company.address}</p>
          )}
          <div className="flex items-center gap-3 mt-3">
            {company.googleRating && (
              <span className="text-xs text-gray-500">
                ⭐ {company.googleRating} ({company.googleReviews || 0})
              </span>
            )}
            {company.allianceStatus === "active" && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Aliado Ueno+
              </span>
            )}
          </div>
        </div>
        {scoreNum !== null && <ScoreBadge score={scoreNum} />}
      </div>
      {company.summary && (
        <p className="text-xs text-gray-500 mt-3 line-clamp-2">{company.summary}</p>
      )}
    </Link>
  );
}
