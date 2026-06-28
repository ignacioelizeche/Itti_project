import type { FastifyInstance } from "fastify";
import { config } from "../../config.js";
import { prisma } from "../../lib/prisma.js";
import { analyzeQueue } from "../../services/ai/analysis-pipeline.js";
import { AnalyzeSchema } from "../../schemas/index.js";
import { validateOrReply } from "../../lib/validate.js";

export async function analysisRoutes(fastify: FastifyInstance) {
  // POST /api/scores/analyze/:companyId - Trigger analysis for a company
  fastify.post<{
    Params: { companyId: string };
  }>("/analyze/:companyId", {
    schema: {
      tags: ["Scoring"],
      summary: "Analizar empresa con IA",
      params: { type: "object", properties: { companyId: { type: "string" } } },
    },
  }, async (request, reply) => {
    const { companyId } = request.params;

    const data = validateOrReply(AnalyzeSchema, request.body || {}, reply);
    if (!data) return;

    const { force } = data;

    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) },
    });

    if (!company) {
      return reply.status(404).send({ error: "Company not found" });
    }

    if (!force) {
      const existing = await prisma.companyScore.findUnique({
        where: { companyId: parseInt(companyId) },
      });
      if (existing) {
        return {
          message: "Company already analyzed",
          score: existing,
        };
      }
    }

    const job = await analyzeQueue.add(
      `analyze-${companyId}`,
      { companyId: parseInt(companyId), force },
      {
        attempts: config.workers.analyzeAttempts,
        backoff: { type: "exponential", delay: config.workers.analyzeBackoffDelay },
      }
    );

    return {
      message: "Analysis started",
      jobId: job.id,
      companyId: parseInt(companyId),
    };
  });

  // POST /api/scores/analyze-batch - Trigger batch analysis
  fastify.post<{
    Body: { category?: string; limit?: number; force?: boolean };
  }>("/analyze-batch", {
    schema: {
      tags: ["Scoring"],
      summary: "Analizar múltiples empresas en lote",
    },
  }, async (request) => {
    const { category, limit = 50, force = false } = request.body;

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (!force) {
      where.score = { is: null };
    }

    const companies = await prisma.company.findMany({
      where,
      select: { id: true, name: true },
      take: limit,
    });

    let queued = 0;
    for (const company of companies) {
      await analyzeQueue.add(
        `analyze-${company.id}`,
        { companyId: company.id, force },
        {
          attempts: config.workers.analyzeAttempts,
          backoff: { type: "exponential", delay: config.workers.analyzeBackoffDelay },
        }
      );
      queued++;
    }

    return {
      message: `Queued ${queued} companies for full pipeline (enrichment + analysis)`,
      category: category || "all",
    };
  });
}
