import type { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { analyzeQueue } from "../workers/analyze-worker.js";
import { enrichCompany } from "../services/enrichment.js";

const prisma = new PrismaClient();

export async function scoreRoutes(fastify: FastifyInstance) {
  // GET /api/scores/company/:companyId - Get company with all data
  fastify.get<{
    Params: { companyId: string };
  }>("/company/:companyId", async (request, reply) => {
    const { companyId } = request.params;

    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) },
      include: {
        score: true,
        analysis: true,
      },
    });

    if (!company) {
      return reply.status(404).send({ error: "Company not found" });
    }

    return {
      ...company,
      createdAt: company.createdAt?.toISOString(),
      updatedAt: company.updatedAt?.toISOString(),
      lastScrapedAt: company.lastScrapedAt?.toISOString(),
    };
  });

  // PATCH /api/scores/company/:companyId - Update company data
  fastify.patch<{
    Params: { companyId: string };
    Body: {
      website?: string;
      instagram?: string;
      facebook?: string;
      phone?: string;
    };
  }>("/company/:companyId", async (request, reply) => {
    const { companyId } = request.params;
    const { website, instagram, facebook, phone } = request.body;

    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) },
    });

    if (!company) {
      return reply.status(404).send({ error: "Company not found" });
    }

    const updateData: Record<string, any> = {};
    if (website !== undefined) updateData.website = website || null;
    if (instagram !== undefined) {
      // Clean Instagram username
      const cleanIg = instagram
        .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
        .replace("@", "")
        .split("/")[0]
        .trim();
      updateData.instagram = cleanIg || null;
    }
    if (facebook !== undefined) {
      // Clean Facebook URL
      const cleanFb = facebook
        .replace(/^https?:\/\/(www\.)?facebook\.com\//, "")
        .split("?")[0]
        .trim();
      updateData.facebook = cleanFb || null;
    }
    if (phone !== undefined) updateData.phone = phone || null;

    const updated = await prisma.company.update({
      where: { id: parseInt(companyId) },
      data: updateData,
    });

    // Auto-enrich after saving if Instagram or Facebook was provided
    const hasNewSocial = (instagram && updated.instagram) || (facebook && updated.facebook);
    if (hasNewSocial) {
      console.log(`[API] Auto-enriching ${updated.name} after contact update`);
      enrichCompany(updated.id).catch((err) =>
        console.error(`[API] Auto-enrich failed for ${updated.name}:`, err.message)
      );
    }

    return {
      message: hasNewSocial
        ? "Datos actualizados. Enriqueciendo redes sociales..."
        : "Datos actualizados",
      company: {
        id: updated.id,
        name: updated.name,
        website: updated.website,
        instagram: updated.instagram,
        facebook: updated.facebook,
        phone: updated.phone,
      },
    };
  });

  // POST /api/scores/decide/:companyId - Approve or reject alliance
  fastify.post<{
    Params: { companyId: string };
    Body: { decision: "approved" | "rejected"; note?: string };
  }>("/decide/:companyId", async (request, reply) => {
    const { companyId } = request.params;
    const { decision, note } = request.body;

    if (!["approved", "rejected"].includes(decision)) {
      return reply.status(400).send({ error: "Decision must be 'approved' or 'rejected'" });
    }

    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) },
    });

    if (!company) {
      return reply.status(404).send({ error: "Company not found" });
    }

    const updated = await prisma.company.update({
      where: { id: parseInt(companyId) },
      data: {
        humanDecision: decision,
        humanNote: note || null,
        decidedAt: new Date(),
      },
    });

    return {
      message: `Alliance ${decision}`,
      company: {
        id: updated.id,
        name: updated.name,
        humanDecision: updated.humanDecision,
        humanNote: updated.humanNote,
      },
    };
  });

  // GET /api/scores/decisions - Get companies with decisions
  fastify.get<{
    Querystring: { filter?: string; limit?: string };
  }>("/decisions", async (request) => {
    const { filter, limit = "100" } = request.query;

    const where: any = {};
    if (filter === "pending") {
      where.humanDecision = null;
      where.score = { isNot: null };
    } else if (filter === "decided") {
      where.humanDecision = { not: null };
    }
    // "all" = no filter

    const companies = await prisma.company.findMany({
      where,
      include: {
        score: { select: { totalScore: true, scoreLabel: true } },
      },
      orderBy: { id: "desc" },
      take: parseInt(limit),
    });

    const approved = await prisma.company.count({ where: { humanDecision: "approved" } });
    const rejected = await prisma.company.count({ where: { humanDecision: "rejected" } });
    const pending = await prisma.company.count({ where: { humanDecision: null, score: { isNot: null } } });

    return {
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        website: c.website,
        instagramFollowers: c.instagramFollowers,
        score: c.score?.totalScore ? Number(c.score.totalScore) : null,
        scoreLabel: c.score?.scoreLabel,
        humanDecision: c.humanDecision,
        humanNote: c.humanNote,
        decidedAt: c.decidedAt,
      })),
      total: companies.length,
      approved,
      rejected,
      pending,
    };
  });

  // GET /api/scores/top - Top companies by affinity score
  fastify.get<{
    Querystring: { limit?: string; category?: string; minScore?: string };
  }>("/top", async (request) => {
    const { limit = "10", category, minScore } = request.query;

    const companies = await prisma.company.findMany({
      where: {
        score: { isNot: null },
        ...(category && { category }),
      },
      include: {
        score: true,
        analysis: {
          select: { summary: true, recommendation: true },
        },
      },
      orderBy: { score: { totalScore: "desc" } },
      take: parseInt(limit),
    });

    // Filter by minScore after query (since it's on the related model)
    const filtered = minScore
      ? companies.filter((c) => c.score && Number(c.score.totalScore) >= parseFloat(minScore))
      : companies;

    return {
      companies: filtered.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        subcategory: c.subcategory,
        city: c.city,
        address: c.address,
        website: c.website,
        instagram: c.instagram,
        instagramFollowers: c.instagramFollowers,
        facebook: c.facebook,
        googleRating: c.googleRating,
        googleReviews: c.googleReviews,
        allianceStatus: c.allianceStatus,
        allianceDetails: c.allianceDetails,
        dataSources: c.dataSources,
        score: c.score,
        summary: c.analysis?.summary,
        recommendation: c.analysis?.recommendation,
      })),
    };
  });

  // GET /api/scores/by-category/:category - Companies by category
  fastify.get<{
    Params: { category: string };
    Querystring: { limit?: string };
  }>("/by-category/:category", async (request, reply) => {
    const { category } = request.params;
    const { limit = "20" } = request.query;

    const companies = await prisma.company.findMany({
      where: {
        category,
        score: { isNot: null },
      },
      include: {
        score: true,
        analysis: {
          select: { summary: true, recommendation: true },
        },
      },
      orderBy: { score: { totalScore: "desc" } },
      take: parseInt(limit),
    });

    if (companies.length === 0) {
      return reply.status(404).send({ error: "No companies found in this category" });
    }

    return {
      category,
      count: companies.length,
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        subcategory: c.subcategory,
        city: c.city,
        googleRating: c.googleRating,
        score: c.score,
        summary: c.analysis?.summary,
      })),
    };
  });

  // POST /api/scores/analyze/:companyId - Trigger analysis for a company
  fastify.post<{
    Params: { companyId: string };
    Body: { force?: boolean };
  }>("/analyze/:companyId", async (request, reply) => {
    const { companyId } = request.params;
    const { force = false } = request.body || {};

    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) },
    });

    if (!company) {
      return reply.status(404).send({ error: "Company not found" });
    }

    // Check if already analyzed
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

    // Add to analyze queue
    const job = await analyzeQueue.add(
      `analyze-${companyId}`,
      { companyId: parseInt(companyId), force },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 30000 },
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
  }>("/analyze-batch", async (request) => {
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
          attempts: 3,
          backoff: { type: "exponential", delay: 30000 },
        }
      );
      queued++;
    }

    return {
      message: `Queued ${queued} companies for full pipeline (enrichment + analysis)`,
      category: category || "all",
    };
  });

  // POST /api/scores/full-flow - Enrich + Analyze batch
  fastify.post<{
    Body: { category?: string; limit?: number; force?: boolean };
  }>("/full-flow", async (request) => {
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
          attempts: 3,
          backoff: { type: "exponential", delay: 30000 },
        }
      );
      queued++;
    }

    return {
      message: `Queued ${queued} companies for full pipeline (enrichment + analysis)`,
      category: category || "all",
      note: "Each company will be enriched first (Instagram, SimilarWeb, Facebook) then analyzed with AI",
    };
  });

  // GET /api/scores/stats - Scoring statistics
  fastify.get("/stats", async () => {
    const total = await prisma.company.count();
    const analyzed = await prisma.companyScore.count();
    const notAnalyzed = total - analyzed;

    const avgScore = await prisma.companyScore.aggregate({
      _avg: { totalScore: true },
    });

    const byLabel = await prisma.companyScore.groupBy({
      by: ["scoreLabel"],
      _count: { scoreLabel: true },
    });

    return {
      total,
      analyzed,
      notAnalyzed,
      averageScore: avgScore._avg.totalScore
        ? Number(avgScore._avg.totalScore)
        : 0,
      byLabel: byLabel.map((l) => ({
        label: l.scoreLabel,
        count: l._count.scoreLabel,
      })),
    };
  });
}
