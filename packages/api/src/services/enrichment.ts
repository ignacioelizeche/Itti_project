import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { enrichInstagram } from "./enrichment/instagram.js";
import { enrichWebsite } from "./enrichment/website.js";
import { enrichFacebook } from "./enrichment/facebook.js";

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

  logger.info(`Enriching: ${company.name}`);

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

  try {
    const ig = await enrichInstagram(company.name, company.website, company.instagram);
    if (ig) {
      result.instagram = {
        scraped: true,
        followers: ig.followers,
        engagementRate: ig.engagementRate,
      };
      dbUpdate.instagram = ig.username;
      dbUpdate.instagramFollowers = ig.followers;
      dataSourcesUpdate.instagram = ig.dataSources;
    }
  } catch (error) {
    logger.error(error, `Instagram enrichment failed for ${company.name}`);
  }

  try {
    if (company.website) {
      const web = await enrichWebsite(company.website);
      if (web) {
        result.webTraffic = {
          scraped: true,
          monthlyVisits: web.monthlyVisits,
          bounceRate: web.bounceRate,
        };
        dataSourcesUpdate.similarweb = web.dataSources;
      }
    }
  } catch (error) {
    logger.error(error, `Website scraping failed for ${company.name}`);
  }

  try {
    const fb = await enrichFacebook(company.name, company.facebook, company.website, company.description);
    if (fb) {
      result.facebook = {
        scraped: true,
        followers: fb.followers,
        rating: 0,
      };
      dbUpdate.facebook = fb.username;
      dataSourcesUpdate.facebook = fb.dataSources;
    }
  } catch (error) {
    logger.error(error, `Facebook enrichment failed for ${company.name}`);
  }

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
      await new Promise((r) => setTimeout(r, 1000));
    } catch (error) {
      logger.error(error, `Failed to enrich ${company.name}`);
    }
  }

  return enriched;
}
