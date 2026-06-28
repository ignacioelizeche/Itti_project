const API_BASE = "/api";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface Company {
  id: number;
  name: string;
  slug: string;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  instagramFollowers: number | null;
  facebook: string | null;
  googleRating: string | null;
  googleReviews: number | null;
  allianceStatus: string | null;
  allianceDetails: { benefit?: string; type?: string } | null;
  dataSources?: Record<string, any>;
}

export interface Score {
  totalScore: string;
  scoreLabel: string;
  categoryFit: string;
  locationFit: string;
  audienceOverlap: string;
  businessSize: string;
  digitalPresence: string;
  reputation: string;
  ittiCompatibility: string;
  alliancePotential: string;
}

export interface Analysis {
  summary: string | null;
  recommendation: string | null;
  strengths: string | null;
  weaknesses: string | null;
}

export interface CompanyWithScore extends Company {
  score: Score | null;
  summary?: string | null;
  recommendation?: string | null;
}

export interface SearchResult {
  companyId: number;
  name: string;
  category: string | null;
  subcategory: string | null;
  address: string | null;
  city: string | null;
  googleRating: string | null;
  googleReviews: number | null;
  totalScore: string | null;
  scoreLabel: string | null;
  summary: string | null;
  recommendation: string | null;
  similarity: number;
  score: Score | null;
}

export interface ScrapeJob {
  id: number;
  source: string;
  category: string | null;
  status: string;
  totalFound: number;
  newCompanies: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface Stats {
  total: number;
  analyzed: number;
  notAnalyzed: number;
  averageScore: number;
  byLabel: { label: string; count: number }[];
}

export const api = {
  getTopCompanies: (limit = 10, category?: string) =>
    fetchAPI<{ companies: CompanyWithScore[] }>(
      `/scores/top?limit=${limit}${category ? `&category=${category}` : ""}`
    ),

  getStats: () => fetchAPI<Stats>("/scores/stats"),

  analyzeCompany: (companyId: number, force = false) =>
    fetchAPI<{ message: string; jobId: string }>(`/scores/analyze/${companyId}`, {
      method: "POST",
      body: JSON.stringify({ force }),
    }),

  analyzeBatch: (category?: string, limit = 50) =>
    fetchAPI<{ message: string }>("/scores/analyze-batch", {
      method: "POST",
      body: JSON.stringify({ category, limit }),
    }),

  fullFlowBatch: (category?: string, limit = 50, force = false) =>
    fetchAPI<{ message: string; note: string }>("/scores/full-flow", {
      method: "POST",
      body: JSON.stringify({ category, limit, force }),
    }),

  decide: (companyId: number, decision: "approved" | "rejected", note?: string) =>
    fetchAPI<{ message: string; company: { id: number; humanDecision: string | null } }>(
      `/scores/decide/${companyId}`,
      { method: "POST", body: JSON.stringify({ decision, note }) }
    ),

  getDecisions: (filter?: string) =>
    fetchAPI<{ companies: any[]; total: number; approved: number; rejected: number; pending: number }>(
      `/scores/decisions${filter ? `?filter=${filter}` : ""}`
    ),

  discover: (query: string, autoEnrich = true) =>
    fetchAPI<{ generatedQueries: string[]; totalFound: number; saved: number; newCompanies: number; companies: any[] }>(
      "/discover",
      { method: "POST", body: JSON.stringify({ query, autoEnrich }) }
    ),

  search: (query: string, options?: { limit?: number; category?: string; minScore?: number }) =>
    fetchAPI<{ results: SearchResult[]; total: number }>("/search", {
      method: "POST",
      body: JSON.stringify({ query, ...options }),
    }),

  triggerScrape: (source: string, category?: string) =>
    fetchAPI<{ message: string; jobIds: number[] }>("/scrape/trigger", {
      method: "POST",
      body: JSON.stringify({ source, category }),
    }),

  getScrapeJobs: () => fetchAPI<{ jobs: ScrapeJob[] }>("/scrape/jobs"),

  getCompany: (id: number) =>
    fetchAPI<any>(`/scores/company/${id}`),

  updateCompany: (id: number, data: Record<string, string>) =>
    fetchAPI<{ message: string; company: any }>(`/scores/company/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
