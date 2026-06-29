"use client";

import { Instagram, Facebook, Globe, ExternalLink } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { EnrichedData } from "@/types";

interface EnrichedDataCardsProps {
  dataSources?: EnrichedData;
  company: {
    instagram?: string | null;
    instagramFollowers?: number | null;
    facebook?: string | null;
    website?: string | null;
  };
}

export function EnrichedDataCards({ dataSources, company }: EnrichedDataCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <InstagramCard dataSources={dataSources} company={company} />
      <FacebookCard dataSources={dataSources} company={company} />
      <WebTrafficCard dataSources={dataSources} company={company} />
    </div>
  );
}

function InstagramCard({ dataSources, company }: EnrichedDataCardsProps) {
  return (
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
  );
}

function FacebookCard({ dataSources, company }: EnrichedDataCardsProps) {
  return (
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
  );
}

function WebTrafficCard({ dataSources, company }: EnrichedDataCardsProps) {
  return (
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
  );
}
