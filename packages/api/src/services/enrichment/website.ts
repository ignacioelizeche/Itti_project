import { scrapeSimilarWeb, extractDomain } from "../scraper/website-scanner.js";

export interface WebsiteEnrichment {
  monthlyVisits: number;
  bounceRate: number;
  dataSources: Record<string, unknown>;
}

export async function enrichWebsite(website: string): Promise<WebsiteEnrichment | null> {
  const domain = extractDomain(website);
  const webData = await scrapeSimilarWeb(domain);
  if (!webData) return null;

  return {
    monthlyVisits: webData.monthlyVisits,
    bounceRate: webData.bounceRate,
    dataSources: {
      monthlyVisits: webData.monthlyVisits,
      bounceRate: webData.bounceRate,
      pagesPerVisit: webData.pagesPerVisit,
      rank: webData.rank,
      source: webData.source,
      title: webData.title || "",
      description: webData.description || "",
      hasEshop: webData.hasEshop || false,
      hasContact: webData.hasContact || false,
      hasWhatsApp: webData.hasWhatsApp || false,
      socialLinks: webData.socialLinks || [],
      qualityScore: webData.qualityScore || 0,
    },
  };
}
