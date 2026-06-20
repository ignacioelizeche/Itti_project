import type { FastifyInstance } from "fastify";
import { Queue } from "bullmq";

const enrichmentQueue = new Queue("enrichment", {
  connection: { host: "localhost", port: 6379 },
});

export async function enrichmentRoutes(fastify: FastifyInstance) {
  // GET /api/enrich/companies - Get companies with enrichment status
  fastify.get<{
    Querystring: { limit?: string; enriched?: string };
  }>("/companies", async (request) => {
    const { limit = "50", enriched } = request.query;
    const prisma = fastify.prisma;

    const where: any = {};
    if (enriched === "true") {
      where.instagramFollowers = { not: null };
    } else if (enriched === "false") {
      where.OR = [
        { instagramFollowers: null },
        { lastScrapedAt: null },
      ];
    }

    const companies = await prisma.company.findMany({
      where,
      take: parseInt(limit),
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        category: true,
        website: true,
        instagram: true,
        instagramFollowers: true,
        facebook: true,
        googleRating: true,
        googleReviews: true,
        lastScrapedAt: true,
        dataSources: true,
        score: {
          select: {
            totalScore: true,
            scoreLabel: true,
          },
        },
      },
    });

    return {
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        website: c.website,
        instagram: c.instagram,
        instagramFollowers: c.instagramFollowers,
        facebook: c.facebook,
        googleRating: c.googleRating,
        googleReviews: c.googleReviews,
        lastScrapedAt: c.lastScrapedAt,
        hasEnrichment: !!(c.instagramFollowers || c.lastScrapedAt),
        webTraffic: (c.dataSources as any)?.similarweb || null,
        facebookData: (c.dataSources as any)?.facebook || null,
        score: c.score?.totalScore || null,
        scoreLabel: c.score?.scoreLabel || null,
      })),
      total: companies.length,
    };
  });

  // POST /api/enrich/trigger - Start enrichment for a company or batch
  fastify.post<{
    Body: {
      companyId?: number;
      batch?: boolean;
      limit?: number;
    };
  }>("/trigger", async (request, reply) => {
    const { companyId, batch = false, limit = 10 } = request.body;

    if (!companyId && !batch) {
      return reply
        .status(400)
        .send({ error: "Provide companyId or batch: true" });
    }

    const job = await enrichmentQueue.add("enrich", {
      companyId,
      batch,
      limit,
    });

    return {
      message: batch
        ? `Started batch enrichment for ${limit} companies`
        : `Started enrichment for company ${companyId}`,
      jobId: job.id,
    };
  });

  // GET /api/enrich/status - Get enrichment queue status
  fastify.get("/status", async () => {
    const [waiting, active, completed, failed] = await Promise.all([
      enrichmentQueue.getWaitingCount(),
      enrichmentQueue.getActiveCount(),
      enrichmentQueue.getCompletedCount(),
      enrichmentQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed,
    };
  });

  // GET /api/enrich/recent - Get recent enrichment jobs
  fastify.get<{
    Querystring: { limit?: string };
  }>("/recent", async (request) => {
    const { limit = "20" } = request.query;

    const jobs = await enrichmentQueue.getJobs(
      ["completed", "failed", "active", "waiting"],
      0,
      parseInt(limit) - 1
    );

    return {
      jobs: jobs.map((job) => ({
        id: job.id,
        data: job.data,
        progress: job.progress,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
      })),
    };
  });

  // DELETE /api/enrich/clean - Clean completed jobs
  fastify.delete("/clean", async () => {
    await enrichmentQueue.clean(0, 100, "completed");
    await enrichmentQueue.clean(0, 100, "failed");
    return { message: "Cleaned completed and failed jobs" };
  });
}
