import { Queue, Worker, Job } from "bullmq";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";
import { searchPlaces } from "../services/scraper/google-places.js";
import { scrapePaginasAmarillas, scrapeGuiaCommercial } from "../services/scraper/directories.js";
import { ASUNCION_COORDS } from "../utils/consts.js";
import { scrapeWebsite } from "../services/scraper/web-scraper.js";
import { normalizeBatch } from "../services/scraper/normalizer.js";
import { enrichCompany } from "../services/enrichment.js";
import { analyzeQueue } from "../services/ai/analysis-pipeline.js";
import { getQueueConnection } from "../lib/queue.js";

const connectionConfig = getQueueConnection();

// Queue for scraping jobs
export const scrapeQueue = new Queue("scrape", { connection: connectionConfig });

interface ScrapeJobData {
  source: "google_places" | "directories" | "web";
  category: string;
  jobId: number;
}

// Worker to process scraping jobs
const scrapeWorker = new Worker(
  "scrape",
  async (job: Job<ScrapeJobData>) => {
    const { source, category, jobId } = job.data;

    console.log(`[ScrapeWorker] Processing ${source} for "${category}" (job ${jobId})`);

    // Mark job as active
    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: { status: "active", startedAt: new Date() },
    });

    let totalFound = 0;
    let newCompanies = 0;
    const errors: string[] = [];

    try {
      let rawData: Array<{
        name: string;
        address?: string;
        latitude?: number;
        longitude?: number;
        category?: string;
        phone?: string;
        website?: string;
        googleRating?: number;
        googleReviews?: number;
        source: string;
      }> = [];

      switch (source) {
        case "google_places": {
          const query = `${category} en Asunción, Paraguay`;
          const results = await searchPlaces({
            query,
            locationBias: {
              latitude: ASUNCION_COORDS.latitude,
              longitude: ASUNCION_COORDS.longitude,
              radius: config.scraper.googlePlacesRadius,
            },
            maxResults: config.scraper.googlePlacesMaxResults,
            languageCode: "es",
          });

          rawData = results.map((r) => ({
            name: r.name,
            address: r.address,
            latitude: r.latitude,
            longitude: r.longitude,
            category: r.category,
            phone: r.phoneNumber,
            website: r.website,
            googleRating: r.googleRating,
            googleReviews: r.googleReviews,
            source: "google_places",
          }));

          totalFound = rawData.length;
          break;
        }

        case "directories": {
          const paginasResults = await scrapePaginasAmarillas(category);
          const guiaResults = await scrapeGuiaCommercial(category);

          rawData = [
            ...paginasResults.map((r) => ({
              name: r.name,
              address: r.address,
              phone: r.phone,
              website: r.website,
              category: r.category,
              source: "directories" as const,
            })),
            ...guiaResults.map((r) => ({
              name: r.name,
              address: r.address,
              phone: r.phone,
              website: r.website,
              category: r.category,
              source: "directories" as const,
            })),
          ];

          totalFound = rawData.length;
          break;
        }

        case "web": {
          // Scrape websites of existing companies that don't have much data
          const companies = await prisma.company.findMany({
            where: {
              website: { not: null },
              OR: [
                { description: null },
                { instagram: null },
              ],
            },
            take: 20,
          });

          for (const company of companies) {
            if (!company.website) continue;

            const webData = await scrapeWebsite(company.website);
            if (!webData) continue;

            // Update company with scraped web data
            await prisma.company.update({
              where: { id: company.id },
              data: {
                description: webData.description || company.description,
                instagram: webData.socialLinks.instagram || company.instagram,
                facebook: webData.socialLinks.facebook || company.facebook,
                lastScrapedAt: new Date(),
                dataSources: {
                  ...(company.dataSources as Record<string, unknown>),
                  web_scrape: new Date().toISOString(),
                },
              },
            });

            totalFound++;
            newCompanies++; // Using as "updated" count
          }
          break;
        }
      }

      // Normalize and upsert for google_places and directories
      if (source !== "web" && rawData.length > 0) {
        const result = await normalizeBatch(prisma, rawData);
        newCompanies = result.created;
        errors.push(
          ...Array(result.errors).fill("normalize_error")
        );

        // Auto-enrich new companies (fire and forget)
        if (newCompanies > 0) {
          console.log(`[ScrapeWorker] Auto-enriching ${newCompanies} new companies...`);
          // Get recently created companies that need enrichment
          const recentCompanies = await prisma.company.findMany({
            where: {
              lastScrapedAt: { not: null },
              instagramFollowers: null,
            },
            orderBy: { createdAt: "desc" },
            take: newCompanies,
          });
          for (const company of recentCompanies) {
            enrichCompany(company.id).catch((err) => {
              console.error(`[ScrapeWorker] Auto-enrich failed for ${company.name}:`, err);
            });
            // Queue for analysis
            analyzeQueue.add(`analyze-${company.id}`, { companyId: company.id }, {
              attempts: config.workers.scrapeAttempts,
              backoff: { type: "exponential", delay: config.workers.scrapeBackoffDelay },
            }).catch((err) => {
              console.error(`[ScrapeWorker] Failed to queue analysis for ${company.name}:`, err);
            });
          }
        }
      }

      // Mark job as completed
      await prisma.scrapeJob.update({
        where: { id: jobId },
        data: {
          status: "completed",
          totalFound,
          newCompanies,
          completedAt: new Date(),
          errors: errors.length > 0 ? errors : undefined,
        },
      });

      console.log(
        `[ScrapeWorker] Completed: ${totalFound} found, ${newCompanies} new`
      );

      return { totalFound, newCompanies, errors: errors.length };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[ScrapeWorker] Error:`, errorMsg);

      await prisma.scrapeJob.update({
        where: { id: jobId },
        data: {
          status: "failed",
          totalFound,
          newCompanies,
          completedAt: new Date(),
          errors: [errorMsg],
        },
      });

      throw error;
    }
  },
  {
    connection: connectionConfig,
    concurrency: config.workers.concurrency,
  }
);

scrapeWorker.on("completed", (job) => {
  console.log(`[ScrapeWorker] Job ${job.id} completed`);
});

scrapeWorker.on("failed", (job, err) => {
  console.error(`[ScrapeWorker] Job ${job?.id} failed:`, err.message);
});

export { scrapeWorker };
