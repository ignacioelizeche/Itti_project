import type { FastifyInstance } from "fastify";
import { scrapeQueue } from "../workers/scrape-worker.js";
import { prisma } from "../lib/prisma.js";
import { ScrapeTriggerSchema } from "../schemas/index.js";
import { validateOrReply } from "../lib/validate.js";

const CATEGORIES = [
  "Restaurantes",
  "Tecnología",
  "Moda",
  "Fitness",
  "Educación",
];

export async function scrapeRoutes(fastify: FastifyInstance) {
  // POST /api/scrape/trigger - Start a new scraping job
  fastify.post("/trigger", async (request, reply) => {
    const data = validateOrReply(ScrapeTriggerSchema, request.body, reply);
    if (!data) return;

    const { source, category } = data;

    const categoriesToScrape = category ? [category] : CATEGORIES;
    const jobs: number[] = [];

    for (const cat of categoriesToScrape) {
      // Create job record in DB
      const dbJob = await prisma.scrapeJob.create({
        data: {
          source,
          category: cat,
          status: "pending",
        },
      });

      // Add to BullMQ queue
      await scrapeQueue.add(
        `scrape-${source}-${cat}`,
        {
          source,
          category: cat,
          jobId: dbJob.id,
        },
        {
          attempts: 2,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
        }
      );

      jobs.push(dbJob.id);
    }

    return {
      message: `Started ${jobs.length} scraping job(s)`,
      jobIds: jobs,
    };
  });

  // GET /api/scrape/jobs - List all scrape jobs
  fastify.get<{
    Querystring: { status?: string; limit?: string };
  }>("/jobs", async (request, reply) => {
    const { status, limit: rawLimit = "20" } = request.query;

    const parsedLimit = parseInt(rawLimit);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return reply.status(400).send({ error: "Invalid limit parameter" });
    }

    const jobs = await prisma.scrapeJob.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: parsedLimit,
    });

    return { jobs };
  });

  // GET /api/scrape/jobs/:id - Get job details
  fastify.get<{
    Params: { id: string };
  }>("/jobs/:id", async (request, reply) => {
    const { id } = request.params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return reply.status(400).send({ error: "Invalid job ID" });
    }

    const job = await prisma.scrapeJob.findUnique({
      where: { id: parsedId },
    });

    if (!job) {
      return reply.status(404).send({ error: "Job not found" });
    }

    return { job };
  });

  // GET /api/scrape/stats - Get scraping statistics
  fastify.get("/stats", async () => {
    const totalCompanies = await prisma.company.count();
    const totalJobs = await prisma.scrapeJob.count();
    const activeJobs = await prisma.scrapeJob.count({
      where: { status: "active" },
    });

    const recentJobs = await prisma.scrapeJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return {
      totalCompanies,
      totalJobs,
      activeJobs,
      recentJobs,
    };
  });
}
