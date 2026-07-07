import type { FastifyInstance, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { analyzeCompany } from "../../services/ai/analysis-pipeline.js";
import { AnalyzeSchema } from "../../schemas/index.js";
import { validateOrReply } from "../../lib/validate.js";
import { logger } from "../../lib/logger.js";

let batchRunning = false;

function parseCompanyId(companyId: string, reply: FastifyReply): number | null {
  const id = parseInt(companyId);
  if (isNaN(id)) {
    reply.status(400).send({ error: "Invalid companyId" });
    return null;
  }
  return id;
}

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

    const id = parseCompanyId(companyId, reply);
    if (id === null) return;

    const data = validateOrReply(AnalyzeSchema, request.body || {}, reply);
    if (!data) return;

    const { force } = data;

    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return reply.status(404).send({ error: "Company not found" });
    }

    if (!force) {
      const existing = await prisma.companyScore.findUnique({
        where: { companyId: id },
      });
      if (existing) {
        return {
          message: "Company already analyzed",
          score: existing,
        };
      }
    }

    // Run analysis directly in the request (background via queue was unreliable)
    analyzeCompany(id).catch((err) => {
      logger.error(err, `[Analysis] Direct analysis failed for company ${companyId}`);
    });

    return {
      message: "Analysis started",
      companyId: id,
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
  }, async (request, reply) => {
    if (batchRunning) {
      return reply.status(409).send({ error: "Ya hay un batch de análisis en progreso. Esperá a que termine." });
    }

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

    if (companies.length === 0) {
      return { message: "No hay empresas pendientes de análisis", processed: 0 };
    }

    // Run analyses sequentially in background (fire and forget)
    batchRunning = true;
    const runBatch = async () => {
      for (const company of companies) {
        try {
          await analyzeCompany(company.id);
        } catch (err) {
          logger.error(err, `[Analysis] Batch failed for ${company.name} (id=${company.id})`);
        }
      }
      batchRunning = false;
      logger.info(`[Analysis] Batch complete: ${companies.length} companies analyzed`);
    };
    runBatch().catch((err) => {
      logger.error(err, `[Analysis] Batch crashed`);
      batchRunning = false;
    });

    return {
      message: `Análisis iniciado para ${companies.length} empresas (se procesan en segundo plano)`,
      total: companies.length,
    };
  });
}
