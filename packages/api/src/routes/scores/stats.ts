import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";

export async function statsRoutes(fastify: FastifyInstance) {
  // GET /api/scores/stats - Scoring statistics
  fastify.get("/stats", {
    schema: {
      tags: ["Scoring"],
      summary: "Estadísticas de scoring",
    },
  }, async () => {
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
}
