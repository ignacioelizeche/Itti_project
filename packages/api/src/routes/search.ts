import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { semanticSearch } from "../services/search/semantic.js";
import { SearchSchema } from "../schemas/index.js";
import { validateOrReply } from "../lib/validate.js";

export async function searchRoutes(fastify: FastifyInstance) {
  // POST /api/search - Semantic search
  fastify.post("/", {
    schema: {
      tags: ["Search"],
      summary: "Búsqueda semántica de empresas",
      description: "Busca empresas usando embeddings y lenguaje natural",
    },
  }, async (request, reply) => {
    const data = validateOrReply(SearchSchema, request.body, reply);
    if (!data) return;

    const { query, limit, category, minScore, city, textFilter = "" } = data;

    try {
      const results = await semanticSearch(query, {
        limit,
        category,
        minScore,
        city,
        textFilter: textFilter || undefined,
      });

      await prisma.searchLog.create({
        data: {
          query,
          resultCount: results.length,
          topScore: results[0]?.totalScore || null,
        },
      });

      return {
        query,
        results,
        total: results.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Search failed";
      return reply.status(500).send({ error: message });
    }
  });

  // GET /api/search/logs - Recent search logs
  fastify.get<{
    Querystring: { limit?: string };
  }>("/logs", async (request) => {
    const { limit = "20" } = request.query;

    const logs = await prisma.searchLog.findMany({
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
    });

    return { logs };
  });
}
