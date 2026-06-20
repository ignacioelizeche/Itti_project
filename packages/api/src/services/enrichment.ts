import { PrismaClient } from "@prisma/client";
import { scrapeInstagram, extractInstagramUsername } from "./scraper/instagram.js";
import { scrapeSimilarWeb, extractDomain } from "./scraper/similarweb.js";
import { scrapeFacebook, extractFacebookUrl } from "./scraper/facebook.js";

const prisma = new PrismaClient();

export interface EnrichmentResult {
  companyId: number;
  name: string;
  instagram: {
    scraped: boolean;
    followers: number;
    engagementRate: number;
  } | null;
  webTraffic: {
    scraped: boolean;
    monthlyVisits: number;
    bounceRate: number;
  } | null;
  facebook: {
    scraped: boolean;
    followers: number;
    rating: number;
  } | null;
}

export async function enrichCompany(companyId: number): Promise<EnrichmentResult | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) return null;

  console.log(` enriching: ${company.name}`);

  const result: EnrichmentResult = {
    companyId,
    name: company.name,
    instagram: null,
    webTraffic: null,
    facebook: null,
  };

  // 1. Instagram scraping
  try {
    const igUsername = await extractInstagramUsername(
      company.website || undefined,
      company.instagram || undefined
    );

    if (igUsername) {
      const igData = await scrapeInstagram(igUsername);
      if (igData) {
        result.instagram = {
          scraped: true,
          followers: igData.followers,
          engagementRate: igData.engagementRate,
        };

        // Update company in DB
        await prisma.company.update({
          where: { id: companyId },
          data: {
            instagram: igUsername,
            instagramFollowers: igData.followers,
          },
        });
      }
    }
  } catch (error) {
    console.error(`Instagram enrichment failed for ${company.name}:`, error);
  }

  // 2. SimilarWeb scraping
  try {
    if (company.website) {
      const domain = extractDomain(company.website);
      const webData = await scrapeSimilarWeb(domain);
      if (webData) {
        result.webTraffic = {
          scraped: true,
          monthlyVisits: webData.monthlyVisits,
          bounceRate: webData.bounceRate,
        };

        // Store in data_sources or alliance_details
        await prisma.company.update({
          where: { id: companyId },
          data: {
            dataSources: {
              ...(company.dataSources as object || {}),
              similarweb: {
                monthlyVisits: webData.monthlyVisits,
                bounceRate: webData.bounceRate,
                pagesPerVisit: webData.pagesPerVisit,
                rank: webData.rank,
              },
            },
          },
        });
      }
    }
  } catch (error) {
    console.error(`SimilarWeb enrichment failed for ${company.name}:`, error);
  }

  // 3. Facebook scraping
  try {
    const fbUsername = company.facebook
      || extractFacebookUrl(company.website || "")
      || extractFacebookUrl(company.description || "");

    if (fbUsername) {
      const fbData = await scrapeFacebook(fbUsername);
      if (fbData) {
        result.facebook = {
          scraped: true,
          followers: fbData.followers,
          rating: fbData.rating,
        };

        await prisma.company.update({
          where: { id: companyId },
          data: {
            facebook: fbUsername,
            dataSources: {
              ...(company.dataSources as object || {}),
              facebook: {
                followers: fbData.followers,
                likes: fbData.likes,
                rating: fbData.rating,
                reviewCount: fbData.reviewCount,
              },
            },
          },
        });
      }
    }
  } catch (error) {
    console.error(`Facebook enrichment failed for ${company.name}:`, error);
  }

  // Update last_scraped_at
  await prisma.company.update({
    where: { id: companyId },
    data: { lastScrapedAt: new Date() },
  });

  return result;
}

export async function enrichBatch(limit: number = 10): Promise<number> {
  // Get companies that haven't been enriched recently (no instagram data and no last_scraped_at)
  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { instagramFollowers: null },
        { lastScrapedAt: null },
      ],
    },
    take: limit,
    orderBy: { id: "asc" },
  });

  let enriched = 0;
  for (const company of companies) {
    try {
      await enrichCompany(company.id);
      enriched++;
      // Rate limiting: 1 second between companies
      await new Promise((r) => setTimeout(r, 1000));
    } catch (error) {
      console.error(`Failed to enrich ${company.name}:`, error);
    }
  }

  return enriched;
}
