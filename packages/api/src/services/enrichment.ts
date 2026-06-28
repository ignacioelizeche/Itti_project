import { prisma } from "../lib/prisma.js";
import { scrapeInstagramViaApify } from "./scraper/instagram-apify.js";
import { extractInstagramUsername } from "./scraper/instagram.js";
import { scrapeSimilarWeb, extractDomain } from "./scraper/similarweb.js";
import { scrapeFacebookByName, extractFacebookUrl } from "./scraper/facebook.js";

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

  const dataSourcesUpdate: Record<string, any> = {
    ...(company.dataSources as Record<string, any> || {}),
  };
  const dbUpdate: Record<string, any> = {};

  // 1. Instagram scraping via Apify
  try {
    const igUsername = await extractInstagramUsername(
      company.website || undefined,
      company.instagram || undefined
    );

    if (igUsername) {
      const igData = await scrapeInstagramViaApify(igUsername);
      if (igData) {
        const avgLikes =
          igData.recentPosts.length > 0
            ? igData.recentPosts.reduce((s, p) => s + p.likesCount, 0) /
              igData.recentPosts.length
            : 0;
        const avgComments =
          igData.recentPosts.length > 0
            ? igData.recentPosts.reduce((s, p) => s + p.commentsCount, 0) /
              igData.recentPosts.length
            : 0;
        const engagementRate =
          igData.followersCount > 0
            ? Math.round(
                ((avgLikes + avgComments) / igData.followersCount) * 10000
              ) / 100
            : 0;

        result.instagram = {
          scraped: true,
          followers: igData.followersCount,
          engagementRate,
        };

        dbUpdate.instagram = igUsername;
        dbUpdate.instagramFollowers = igData.followersCount;
        dataSourcesUpdate.instagram = {
          fullName: igData.fullName,
          biography: igData.biography,
          followersCount: igData.followersCount,
          postsCount: igData.postsCount,
          isBusinessAccount: igData.isBusinessAccount,
          isVerified: igData.isVerified,
          avgLikes: Math.round(avgLikes),
          avgComments: Math.round(avgComments),
          engagementRate,
          scrapedAt: new Date().toISOString(),
        };
      }
    }
  } catch (error) {
    console.error(`Instagram enrichment failed for ${company.name}:`, error);
  }

  // 2. Website scraping - title, description, e-shop, contact, quality score
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

        dataSourcesUpdate.similarweb = {
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
        };
      }
    }
  } catch (error) {
    console.error(`Website scraping failed for ${company.name}:`, error);
  }

  // 3. Facebook scraping via Apify
  try {
    const fbUsername = company.facebook
      || extractFacebookUrl(company.website || "")
      || extractFacebookUrl(company.description || "");

    if (fbUsername) {
      dbUpdate.facebook = fbUsername;

      const fbData = await scrapeFacebookByName(company.name, fbUsername);
      if (fbData) {
        result.facebook = {
          scraped: true,
          followers: fbData.followers,
          rating: 0,
        };

        dataSourcesUpdate.facebook = {
          name: fbData.name,
          followers: fbData.followers,
          likes: fbData.likes,
          rating: fbData.rating,
          category: fbData.category,
          phone: fbData.phone,
          email: fbData.email,
          website: fbData.website,
          address: fbData.address,
          scrapedAt: new Date().toISOString(),
        };
      }
    }
  } catch (error) {
    console.error(`Facebook enrichment failed for ${company.name}:`, error);
  }

  // Single DB update with all accumulated data
  dbUpdate.dataSources = dataSourcesUpdate;
  dbUpdate.lastScrapedAt = new Date();

  await prisma.company.update({
    where: { id: companyId },
    data: dbUpdate,
  });

  return result;
}

export async function enrichBatch(limit: number = 10): Promise<number> {
  const companies = await prisma.company.findMany({
    where: {
      instagram: { not: null },
      instagramFollowers: null,
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
