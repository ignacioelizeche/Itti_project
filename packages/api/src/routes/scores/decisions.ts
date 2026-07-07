import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { DecideSchema, DecisionFilterSchema } from "../../schemas/index.js";
import { validateOrReply } from "../../lib/validate.js";

export async function decisionRoutes(fastify: FastifyInstance) {
  // POST /api/scores/decide/:companyId - Approve or reject alliance
  fastify.post<{
    Params: { companyId: string };
  }>("/decide/:companyId", async (request, reply) => {
    const { companyId } = request.params;
    const parsedCompanyId = parseInt(companyId);
    if (isNaN(parsedCompanyId)) {
      return reply.status(400).send({ error: "Invalid companyId" });
    }

    const data = validateOrReply(DecideSchema, request.body, reply);
    if (!data) return;

    const { decision, note } = data;

    const company = await prisma.company.findUnique({
      where: { id: parsedCompanyId },
    });

    if (!company) {
      return reply.status(404).send({ error: "Company not found" });
    }

    const updated = await prisma.company.update({
      where: { id: parsedCompanyId },
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
  }>("/decisions", async (request, reply) => {
    const parseResult = DecisionFilterSchema.safeParse(request.query);
    const { filter, limit: rawLimit = "100" } = parseResult.success ? parseResult.data : { filter: "all", limit: "100" };

    const parsedLimit = parseInt(rawLimit);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return reply.status(400).send({ error: "Invalid limit parameter" });
    }

    const where: any = {};
    if (filter === "pending") {
      where.humanDecision = null;
      where.score = { isNot: null };
    } else if (filter === "decided") {
      where.humanDecision = { not: null };
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        score: { select: { totalScore: true, scoreLabel: true } },
      },
      orderBy: { id: "desc" },
      take: parsedLimit,
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
}
